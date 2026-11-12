import http from 'node:http';
import {booleanPointInPolygon, point} from '@turf/turf';
import {cityBoundary, riskAreas, streams, historicalOccurrences, floodAreas, floodAreasAlongRoute, findPlaces, drivingRoutes} from './providers.js';
import {analyzeRoutes, routeWithinCity} from './analysis.js';
import {analyzeFloodContext} from './floodContext.js';
import {createRainProvider} from './rain.js';
import {createAlertsProvider} from './alerts.js';
import {distinctHistory, hasStableHistoryId, rainForRoute, scoreRoutes} from './routeScoring.js';

function send(res, status, data) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
function validCoordinate(value) {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) && value[0] >= -47 && value[0] <= -46 && value[1] >= -24.2 && value[1] <= -23.2;
}
async function body(req) {
  let content = '';
  for await (const chunk of req) { content += chunk; if (content.length > 4096) throw new Error('Pedido muito grande.'); }
  return JSON.parse(content);
}
export function createServer({key = process.env.HEIGIT_API_KEY || '', rainEnabled=process.env.SIBH_RAIN_EXPERIMENTAL!=='false', rain:loadRain=createRainProvider(), alerts:loadAlerts, historicalOccurrences: loadOccurrences = historicalOccurrences, floodAreas: loadFloodAreas = floodAreas, floodAreasAlongRoute:loadFloodAlong = floodAreasAlongRoute, cityBoundary:loadCity=cityBoundary, riskAreas:loadRisk=riskAreas, drivingRoutes:loadRoutes=drivingRoutes} = {}) {
  const alerts=loadAlerts || createAlertsProvider({cityBoundary:loadCity});
  return http.createServer(async (req,res) => {
    const url = new URL(req.url,'http://localhost');
    try {
      if (req.method==='GET' && url.pathname==='/api/alerts') return send(res,200,await alerts());
      if (req.method==='GET' && url.pathname==='/api/rain') {
        if (!rainEnabled) return send(res,503,{error:'Dados de chuva indisponíveis: integração experimental desativada.'});
        return send(res,200,await loadRain());
      }
      if (req.method === 'GET' && ['/api/streams','/api/occurrences','/api/flood-areas'].includes(url.pathname)) {
        const box = (url.searchParams.get('bbox') || '').split(',').map(Number);
        if (box.length !== 4 || !box.every(Number.isFinite) || box[0] < -46.95 || box[2] > -46.30 || box[1] < -24.1 || box[3] > -23.3 || box[2] <= box[0] || box[3] <= box[1] || box[2]-box[0] > 0.3 || box[3]-box[1] > 0.3) return send(res,400,{error:'Área do mapa inválida ou muito ampla.'});
        const kind=url.searchParams.get('kind') || 'alagamento', period=Number(url.searchParams.get('period'));
        if (url.pathname==='/api/occurrences' && !['alagamento','inundacao'].includes(kind)) return send(res,400,{error:'Tipo de ocorrência inválido.'});
        if (url.pathname==='/api/flood-areas' && ![5,25,100].includes(period)) return send(res,400,{error:'Período inválido.'});
        return send(res,200,await (url.pathname === '/api/streams' ? streams(box) : url.pathname==='/api/occurrences' ? loadOccurrences(box,kind) : loadFloodAreas(box,period)));
      }
      if (req.method === 'GET' && url.pathname === '/api/places') {
        const query = (url.searchParams.get('q') || '').trim();
        if (query.length < 3 || query.length > 200) return send(res,400,{error:'Informe um endereço com pelo menos 3 caracteres.'});
        if (!key) return send(res,503,{error:'Configure a chave HEIGIT_API_KEY para pesquisar endereços.'});
        return send(res,200,{places:await findPlaces(query,await cityBoundary(),key)});
      }
      if (req.method === 'POST' && url.pathname === '/api/location') {
        let input;
        try {input=await body(req);} catch {return send(res,400,{error:'Localização inválida.'});}
        if (!validCoordinate(input?.coordinates)) return send(res,400,{error:'A localização deve estar no município de São Paulo.'});
        const city=await loadCity();
        if (!booleanPointInPolygon(point(input.coordinates),city)) return send(res,400,{error:'A localização deve estar no município de São Paulo.'});
        return send(res,200,{valid:true});
      }
      if (req.method === 'POST' && url.pathname === '/api/routes') {
        if (!key) return send(res,503,{error:'Configure a chave HEIGIT_API_KEY para consultar rotas.'});
        let input;
        try { input = await body(req); } catch { return send(res,400,{error:'Pedido inválido.'}); }
        if (!validCoordinate(input?.origin) || !validCoordinate(input?.destination) || input.origin.join() === input.destination.join()) return send(res,400,{error:'Origem e destino inválidos.'});
        const city = await loadCity();
        if (![input.origin,input.destination].every(c => booleanPointInPolygon(point(c),city))) return send(res,400,{error:'Origem e destino devem estar no município de São Paulo.'});
        const routes = await loadRoutes(input.origin,input.destination,key);
        const valid = routes.filter(route => routeWithinCity(route,city));
        if (!valid.length) return send(res,200,{routes:[],recommendationReason:'no_routes',sources:{risk:{status:'not_queried'},history:{alagamento:'not_queried',inundacao:'not_queried'}},message:routes.length ? 'As rotas encontradas saem do município de São Paulo.' : 'Nenhuma rota foi encontrada.'});
        const coordinates=valid.flatMap(route=>route.geometry.coordinates), pad=0.0015;
        const box=[Math.min(...coordinates.map(c=>c[0]))-pad,Math.min(...coordinates.map(c=>c[1]))-pad,Math.max(...coordinates.map(c=>c[0]))+pad,Math.max(...coordinates.map(c=>c[1]))+pad];
        const queried=await Promise.allSettled([
          loadRisk(),loadOccurrences(box,'alagamento'),loadOccurrences(box,'inundacao'),
          rainEnabled?loadRain():Promise.reject(new Error('Chuva desativada.')),
          ...valid.map(route=>loadFloodAlong(route.geometry.coordinates,5))
        ]);
        let areas=queried[0].status==='fulfilled'?queried[0].value:null;
        let analyzed;
        try {analyzed=analyzeRoutes(valid,areas);} catch {areas=null;analyzed=analyzeRoutes(valid,null);}
        const histories=queried.slice(1,3).map(item=>item.status==='fulfilled'?item.value:null);
        const historyStatus=Object.fromEntries(['alagamento','inundacao'].map((kind,index)=>[kind,!histories[index]?'unavailable':histories[index].truncated || histories[index].features.some(feature=>!hasStableHistoryId(feature))?'partial':'available']));
        const combined=distinctHistory(histories.flatMap((item,index)=>(item?.features || []).map(feature=>({...feature,kind:['alagamento','inundacao'][index]}))));
        const historyComplete=histories.every(item=>item && !item.truncated) && combined.complete;
        const history=histories.some(Boolean)?{features:combined.features,truncated:!historyComplete}:null;
        const rainData=queried[3].status==='fulfilled'?queried[3].value:null;
        const computed=analyzed.map((item,i)=>{
          const floodData={5:queried[4+i].status==='fulfilled'?queried[4+i].value:null};
          let floodContext;
          try {floodContext=analyzeFloodContext(item.route,{history,areas:floodData});} catch {floodContext=analyzeFloodContext(item.route,{history:null,areas:{5:null}});}
          let rain;
          try {rain=rainForRoute(item.route,rainData);} catch {rain={status:'unavailable',maxMm:null,stations:[],queriedAt:rainData?.queriedAt || null,validUntil:null};}
          return {geometry:item.route.geometry,summary:item.route.properties?.summary,exposureMeters:item.exposureMeters,evidence:item.evidence || [],floodContext,historyCount:floodContext.history.status==='available'?floodContext.history.events.length:null,rain};
        });
        const rainStatus=!rainData?'unavailable':computed.every(r=>r.rain.status==='available')?'available':computed.some(r=>r.rain.status!=='unavailable')?'partial':'unavailable';
        const complete=areas!==null && historyComplete && rainStatus==='available' && computed.every(r=>r.floodContext.history.status==='available');
        const score=scoreRoutes(computed.map(r=>({exposureMeters:r.exposureMeters,historyCount:complete?r.historyCount:null,rainMm:complete?r.rain.maxMm:null})));
        const recommendationReason=areas===null?'risk_unavailable':valid.length===1?'single_route':score.reason;
        const recommended=complete?score.recommended:-1;
        return send(res,200,{routes:computed.map((item,i)=>({...item,score:complete?score.scores[i]:null,recommended:i===recommended})),riskAvailable:areas!==null,sources:{risk:{status:areas===null?'unavailable':'available'},history:historyStatus,rain:{status:rainStatus,queriedAt:rainData?.queriedAt || null}},recommendationReason,riskAreas:areas || [],excludedOutside:routes.length-valid.length});
      }
      send(res,404,{error:'Serviço não encontrado.'});
    } catch { send(res,502,{error:'Não foi possível consultar os serviços de dados. Tente novamente.'}); }
  });
}
