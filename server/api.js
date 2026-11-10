import http from 'node:http';
import {booleanPointInPolygon, point} from '@turf/turf';
import {cityBoundary, riskAreas, streams, findPlaces, drivingRoutes} from './providers.js';
import {analyzeRoutes, routeWithinCity} from './analysis.js';

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
export function createServer({key = process.env.HEIGIT_API_KEY || ''} = {}) {
  return http.createServer(async (req,res) => {
    const url = new URL(req.url,'http://localhost');
    try {
      if (req.method === 'GET' && url.pathname === '/api/streams') {
        const box = (url.searchParams.get('bbox') || '').split(',').map(Number);
        if (box.length !== 4 || !box.every(Number.isFinite) || box[0] < -46.95 || box[2] > -46.30 || box[1] < -24.1 || box[3] > -23.3 || box[2] <= box[0] || box[3] <= box[1] || box[2]-box[0] > 0.3 || box[3]-box[1] > 0.3) return send(res,400,{error:'Área do mapa inválida ou muito ampla.'});
        return send(res,200,await streams(box));
      }
      if (req.method === 'GET' && url.pathname === '/api/places') {
        const query = (url.searchParams.get('q') || '').trim();
        if (query.length < 3 || query.length > 200) return send(res,400,{error:'Informe um endereço com pelo menos 3 caracteres.'});
        if (!key) return send(res,503,{error:'Configure a chave HEIGIT_API_KEY para pesquisar endereços.'});
        return send(res,200,{places:await findPlaces(query,await cityBoundary(),key)});
      }
      if (req.method === 'POST' && url.pathname === '/api/routes') {
        if (!key) return send(res,503,{error:'Configure a chave HEIGIT_API_KEY para consultar rotas.'});
        let input;
        try { input = await body(req); } catch { return send(res,400,{error:'Pedido inválido.'}); }
        if (!validCoordinate(input.origin) || !validCoordinate(input.destination) || input.origin.join() === input.destination.join()) return send(res,400,{error:'Origem e destino inválidos.'});
        const city = await cityBoundary();
        if (![input.origin,input.destination].every(c => booleanPointInPolygon(point(c),city))) return send(res,400,{error:'Origem e destino devem estar no município de São Paulo.'});
        const routes = await drivingRoutes(input.origin,input.destination,key);
        const valid = routes.filter(route => routeWithinCity(route,city));
        if (!valid.length) return send(res,200,{routes:[],message:routes.length ? 'As rotas encontradas saem do município de São Paulo.' : 'Nenhuma rota foi encontrada.'});
        let areas = null;
        try { areas = await riskAreas(); } catch { /* A rota continua disponível sem classificar risco. */ }
        let analyzed;
        try { analyzed = analyzeRoutes(valid,areas); } catch { areas = null; analyzed = analyzeRoutes(valid,null); }
        const values = analyzed.map(x => x.exposureMeters);
        const min = Math.min(...values), max = Math.max(...values);
        const recommended = areas && values.length > 1 && max-min >= 1 && values.filter(x => Math.abs(x-min)<1).length === 1 ? values.indexOf(min) : -1;
        return send(res,200,{routes:analyzed.map((item,i) => ({geometry:item.route.geometry,summary:item.route.properties?.summary,exposureMeters:item.exposureMeters,evidence:item.evidence || [],recommended:i===recommended})),riskAvailable:areas !== null, riskAreas:areas || [],excludedOutside:routes.length-valid.length});
      }
      send(res,404,{error:'Serviço não encontrado.'});
    } catch { send(res,502,{error:'Não foi possível consultar os serviços de dados. Tente novamente.'}); }
  });
}
