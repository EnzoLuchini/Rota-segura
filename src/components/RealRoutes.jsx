import React, {useEffect, useRef, useState} from 'react';
import {ArrowDownUp, ArrowLeft, ArrowRight, Car, Footprints, LoaderCircle, LocateFixed, MapPin, Search, X} from 'lucide-react';
import {request} from './RealLayers';
import FloodRouteContext from './FloodRouteContext';
import {scoreRoutes} from '../data/scoreRoutes';

export function useRealRoutes() {
  const [origin,setOrigin] = useState(null), [destination,setDestination] = useState(null);
  const [mode,setMode] = useState('driving');
  const [routes,setRoutes] = useState([]), [areas,setAreas] = useState([]), [selected,setSelected] = useState(0);
  const [riskAvailable,setRiskAvailable] = useState(false), [message,setMessage] = useState(''), [busy,setBusy] = useState(false);
  const [recommendationReason,setRecommendationReason]=useState(null), [sources,setSources]=useState(null);
  const [sourcesUsed,setSourcesUsed]=useState(null);
  const [water,setWater] = useState(false);
  const [rain,setRain] = useState(true);
  const [risk,setRisk] = useState(true);
  const [history,setHistory] = useState(true);
  const [floodPeriod,setFloodPeriod] = useState(0);
  const routeCache=useRef(new Map()), requestSequence=useRef(0);
  const clear = () => {requestSequence.current++;setBusy(false);setRoutes([]);setAreas([]);setMessage('');setRecommendationReason(null);setSources(null);setSourcesUsed(null);};
  async function compare(onSuccess) {
    clear();setBusy(true);
    const id=requestSequence.current;
    const key=JSON.stringify([origin.coordinates,destination.coordinates,mode]);
    const cached=routeCache.current.get(key);
    try {
      const reused=!!cached && Date.now()<cached.expiresAt;
      const data = reused ? cached.data : await request('/api/routes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:origin.coordinates,destination:destination.coordinates,mode})});
      if(id!==requestSequence.current)return;
      if(!reused && data.routes.length && data.riskAvailable && data.sources?.rain?.status==='available' && data.routes.every(route=>route.rain?.status==='available' && Number.isFinite(Date.parse(route.rain.validUntil)) && route.floodContext?.history?.status==='available' && route.floodContext?.areas?.[5]?.status==='available')) {
        const now=Date.now(), expiresAt=Math.min(now+120000,...data.routes.map(route=>Date.parse(route.rain.validUntil)));
        if(expiresAt>now){routeCache.current.delete(key);routeCache.current.set(key,{data,time:now,expiresAt});}
        while(routeCache.current.size>5)routeCache.current.delete(routeCache.current.keys().next().value);
      }
      setRoutes(data.routes);setAreas(data.riskAreas || []);setRiskAvailable(data.riskAvailable);setSelected(0);
      setRecommendationReason(data.recommendationReason || null);setSources(data.sources || null);setSourcesUsed(data.sourcesUsed || null);
      setMessage([data.message || (data.excludedOutside?'Algumas alternativas saem do município e foram excluídas.':''),reused?`Resultado reutilizado da consulta das ${new Date(cached.time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}.`:null].filter(Boolean).join(' '));
      if(data.routes.length) onSuccess();
    } catch(error) {if(id===requestSequence.current)setMessage(error.message);} finally {if(id===requestSequence.current)setBusy(false);}
  }
  return {origin,destination,setOrigin,setDestination,mode,setMode,routes,areas,selected,setSelected,riskAvailable,recommendationReason,sources,sourcesUsed,message,busy,water,setWater,rain,setRain,risk,setRisk,history,setHistory,floodPeriod,setFloodPeriod,clear,compare};
}

function LocationInput({label,place,onChange}) {
  const [text,setText]=useState(place?.label || ''), [items,setItems]=useState([]), [error,setError]=useState(''), [loading,setLoading]=useState(false);
  const sequence=useRef(0);
  React.useEffect(()=>{if(place) setText(place.label);},[place]);
  useEffect(()=>{
    const id=++sequence.current;
    const query=text.trim();
    if(query.length<3 || place?.label===text){setLoading(false);return;}
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setLoading(true);
      try{const data=await request(`/api/places?q=${encodeURIComponent(query)}`,{signal:controller.signal});if(id!==sequence.current)return;setItems(data.places);setError(data.places.length?'':'Nenhum local encontrado em São Paulo.');}
      catch(error){if(id===sequence.current && error.name!=='AbortError')setError(error.message);}
      finally{if(id===sequence.current)setLoading(false);}
    },350);
    return()=>{clearTimeout(timer);controller.abort();};
  },[text,place]);
  return <><div className="input-row real-input-row">{label==='Origem'?<span className="point start"/>:<MapPin size={19} className="dest-icon"/>}<label><small>{label}</small><input aria-label={label} value={text} placeholder="Digite um endereço" autoComplete="off" onChange={e=>{sequence.current++;setText(e.target.value);onChange(null);setItems([]);setError('');setLoading(false);}} onKeyDown={e=>{if(e.key==='Enter' && items.length){e.preventDefault();setText(items[0].label);onChange(items[0]);setItems([]);}if(e.key==='Escape')setItems([]);}}/></label>{loading && <span className="real-search-progress" role="status">Buscando…</span>}</div>{error && <p role="status" className="real-input-error">{error}</p>}{items.length>0 && <ul className="real-place-results">{items.map((item,i)=><li key={i}><button type="button" onClick={()=>{setText(item.label);onChange(item);setItems([]);}}>{item.label}</button></li>)}</ul>}</>;
}

export function RealSearch({data,onCompare}) {
  const [locating,setLocating]=useState(false),[locationError,setLocationError]=useState('');
  const [resetKey,setResetKey]=useState(0);
  const locationRequest=useRef(0);
  useEffect(()=>()=>{locationRequest.current++;},[]);
  const cancelLocation=()=>{locationRequest.current++;setLocating(false);setLocationError('');};
  function locate() {
    const id=++locationRequest.current;
    setLocationError('');
    if (!navigator.geolocation) {setLocationError('Localização indisponível neste navegador. Informe um endereço.');return;}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async position=>{
      if(id!==locationRequest.current)return;
      const coordinates=[position.coords.longitude,position.coords.latitude];
      try {
        await request('/api/location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({coordinates})});
        if(id!==locationRequest.current)return;
        data.setOrigin({label:'Minha localização atual',coordinates});data.clear();
      } catch(error) {if(id===locationRequest.current)setLocationError(error.message);}
      finally {if(id===locationRequest.current)setLocating(false);}
    },error=>{
      if(id!==locationRequest.current)return;
      setLocating(false);
      setLocationError(error.code===1?'A permissão de localização foi negada. Informe um endereço ou altere a permissão do navegador.':error.code===3?'Não foi possível obter a localização a tempo. Tente novamente ou informe um endereço.':'Localização indisponível no momento. Tente novamente ou informe um endereço.');
    },{enableHighAccuracy:false,timeout:15000,maximumAge:0});
  }
  return <><div className="search-box"><LocationInput key={`origin-${resetKey}`} label="Origem" place={data.origin} onChange={v=>{cancelLocation();data.setOrigin(v);data.clear();}}/>
    <div className="real-origin-location"><button className="real-location-button" type="button" onClick={locate} disabled={locating}><LocateFixed size={16}/>{locating?'Obtendo localização…':'Usar minha localização atual'}</button>
    <p className="real-location-note">Usada como origem e enviada ao provedor ao comparar rotas.</p>
    {locationError && <p className="real-input-error" role="status">{locationError}</p>}</div>
    <div className="input-divider"/><LocationInput key={`destination-${resetKey}`} label="Destino" place={data.destination} onChange={v=>{data.setDestination(v);data.clear();}}/></div>
    <div className="trip-actions">
      <button className="swap-trip" type="button" onClick={()=>{cancelLocation();data.setOrigin(null);data.setDestination(null);data.clear();setResetKey(value=>value+1);}}><X size={16} aria-hidden="true"/>Limpar rotas</button>
      <button className="swap-trip" type="button" onClick={()=>{cancelLocation();data.setOrigin(data.destination);data.setDestination(data.origin);data.clear();}}><ArrowDownUp size={16} aria-hidden="true"/>Trocar origem e destino</button>
    </div>
    <fieldset className="travel-mode"><legend>Como você vai?</legend><label><input type="radio" name="travel-mode" checked={data.mode==='driving'} onChange={()=>{data.clear();data.setMode('driving');}}/><Car size={18} aria-hidden="true"/> Carro</label><label><input type="radio" name="travel-mode" checked={data.mode==='walking'} onChange={()=>{data.clear();data.setMode('walking');}}/><Footprints size={18} aria-hidden="true"/> Andando</label></fieldset>
    {data.message && <div className="selection-warning" role="status">{data.message}</div>}
    <button className="primary route-search-button" aria-busy={data.busy} disabled={!data.origin || !data.destination || data.busy || locating} onClick={()=>data.compare(onCompare)}>{data.busy?<LoaderCircle className="route-search-spinner" size={18} aria-hidden="true"/>:<Search size={18} aria-hidden="true"/>}<span aria-live="polite">{data.busy?'Consultando rotas…':'Comparar rotas'}</span></button>
  </>;
}

const formatDate=value=>value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}) : 'não informado';
const formatNumber=value=>value.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const formatMeasurement=value=>Number(value.toPrecision(15)).toLocaleString('pt-BR',{maximumFractionDigits:20,useGrouping:false});
const reasonText={
  sources_incomplete:'Não é possível recomendar: nenhuma fonte tem dados comparáveis para todos os trajetos.',
  risk_unavailable:'Não é possível recomendar: a fonte de áreas de risco está indisponível.',
  single_route:'Somente uma alternativa foi encontrada; não há outras rotas para comparar.',
  fastest_tie:'Indicadores empatados ou muito próximos: o menor tempo foi usado como desempate.',
  equal_tie:'Indicadores empatados ou muito próximos e tempos iguais: a primeira alternativa foi destacada.',
  score_tie:'Não há recomendação: as alternativas apresentam empate ou diferença inferior a um ponto.',
  lowest_combined_score:'Recomendação experimental: menor pontuação relativa entre as alternativas desta consulta.'
};

function incompleteSourceDetails(data) {
  const labels={partial:'parcial',unavailable:'indisponível',not_queried:'não consultado'};
  const details=[];
  const add=(name,status)=>{if(labels[status]) details.push(`${name}: ${labels[status]}.`);};
  add('Áreas de risco',data.sources?.risk?.status);
  add('Histórico de alagamentos',data.sources?.history?.alagamento);
  add('Histórico de inundações',data.sources?.history?.inundacao);
  add('Chuva',data.sources?.rain?.status);
  data.routes.forEach((route,i)=>{
    if(route.rain?.uncoveredSamples>0 && Number.isFinite(route.rain.totalSamples)) details.push(`Trajeto ${i+1}: ${route.rain.uncoveredSamples} de ${route.rain.totalSamples} amostras sem estação de chuva válida a até 3 km.`);
  });
  if(data.sources?.history?.alagamento==='available' && data.sources?.history?.inundacao==='available' && data.routes.some(route=>route.floodContext?.history?.status==='unavailable')) details.push('Não foi possível relacionar os registros históricos a todos os trajetos.');
  return details;
}

export function RealComparison({data,onBack,onSave,onDetails,onStart}) {
  const [clock,setClock]=useState(Date.now);
  const deadlines=data.routes.map(route=>Date.parse(route.rain?.readingsValidUntil)).filter(Number.isFinite);
  const deadline=deadlines.length?Math.min(...deadlines):null;
  useEffect(()=>{
    const update=()=>setClock(Date.now());
    update();
    const timer=deadline!==null && deadline>Date.now()?setTimeout(update,deadline-Date.now()):null;
    document.addEventListener('visibilitychange',update);
    return()=>{if(timer!==null)clearTimeout(timer);document.removeEventListener('visibilitychange',update);};
  },[deadline]);
  const expired=deadline!==null && clock>=deadline;
  const sourceDetails=incompleteSourceDetails(data);
  const expiredScore=expired && data.sourcesUsed ? scoreRoutes(data.routes.map(route=>({exposureMeters:route.exposureMeters,historyCount:route.historyCount,rainMm:null,duration:route.summary?.duration}))) : null;
  const currentReason=expiredScore?.reason || data.recommendationReason;
  const used=expiredScore?.sourcesUsed || data.sourcesUsed;
  const usedLabels={exposureMeters:'áreas mapeadas',historyCount:'histórico',rainMm:'chuva'};
  const routeMeasurement=(value,select)=>{
    const formatted=formatMeasurement(value);
    return data.routes.some(route=>{const other=select(route);return Number.isFinite(other) && other!==value && formatMeasurement(other)===formatted;}) ? value.toLocaleString('pt-BR',{maximumFractionDigits:20,useGrouping:false}) : formatted;
  };
  const fastest=Math.min(...data.routes.map(route=>route.summary?.duration ?? Infinity));
  const selected=data.routes[data.selected];
  return <><button className="back" onClick={onBack}><ArrowLeft size={18}/> Voltar ao início</button><span className="overline">Sua viagem</span><h1>Compare suas rotas</h1><p className="intro route-address">{data.origin?.label} <ArrowRight size={15}/> {data.destination?.label}</p>
    {data.message && <div className="selection-warning" role="status">{data.message}</div>}
    {expired && <div className="selection-warning" role="status">As medições de chuva venceram. {expiredScore?'A comparação foi atualizada sem chuva.':'Consulte as rotas novamente para atualizar a comparação.'}</div>}
    {reasonText[currentReason] && <div className="selection-warning" role="status">{reasonText[currentReason]}</div>}
    {used?.length>0 && <p className="comparison-hint">Fontes usadas: {used.map(key=>usedLabels[key]).filter(Boolean).join(', ')}. {used.length<3?'Pesos ajustados às fontes disponíveis.':''}</p>}
    {sourceDetails.length>0 && <details className="real-explanation"><summary>Dados parciais ou indisponíveis · ver limitações</summary><ul>{sourceDetails.map(detail=><li key={detail}>{detail}</li>)}</ul></details>}
    {!data.riskAvailable && <div className="selection-warning" role="status">Dados de áreas de risco indisponíveis; não entram na comparação.</div>}
    <p className="comparison-hint">{data.mode==='walking'?'Andando':'Carro'} · Selecione uma alternativa para destacá-la no mapa.</p>
    {onStart && <button className="primary" onClick={onStart}>Iniciar acompanhamento</button>}
    <button className="secondary" onClick={onSave}>Salvar como rota frequente</button>
    <div className="route-list real-route-list" role="group" aria-label="Escolha uma rota">{data.routes.map((route,i)=><button className={'route-card '+(data.selected===i?'selected':'')} key={i} onClick={()=>data.setSelected(i)} aria-pressed={data.selected===i}><span className="radio"/><span className="route-content"><span className="route-label">Trajeto {i+1} {data.selected===i && <span className="recommended">Selecionado</span>}</span><span className="route-stats"><strong>{Math.round((route.summary?.duration||0)/60)} min</strong><span>{((route.summary?.distance||0)/1000).toFixed(1)} km{route.summary?.duration===fastest?' · Mais rápida':''}</span></span>
      <small>{route.exposureMeters==null?'Áreas mapeadas indisponíveis':`${routeMeasurement(route.exposureMeters,item=>item.exposureMeters)} m do trajeto em áreas mapeadas`}</small>
      <small>{route.historyCount==null?'Histórico indisponível':`${route.historyCount} registros históricos a até 100 m${route.floodContext?.history?.status==='partial'?' · dados parciais':''}`}</small>
      <small>{route.rain?.maxMm==null?'Chuva indisponível':`Chuva: ${routeMeasurement(route.rain.maxMm,item=>item.rain?.maxMm)} mm · ${expired?'medição antiga':route.rain.status==='available'?'estações associadas':'cobertura parcial'}`}</small>
      <small>{(expired && !expiredScore) || (expiredScore?expiredScore.scores[i]:route.score)==null?'Pontuação indisponível':`${formatNumber(expiredScore?expiredScore.scores[i]:route.score)} pontos · comparação experimental`}</small>
      {((expiredScore?expiredScore.recommended===i:!expired && route.recommended)) && <span className="real-recommended">{currentReason==='single_route'?'Única alternativa encontrada':currentReason==='fastest_tie'?'Desempate pelo menor tempo':currentReason==='equal_tie'?'Primeira alternativa empatada':'Menor pontuação relativa nesta consulta'}</span>}</span></button>)}</div>
    <details className="real-explanation"><summary>Como funciona a comparação experimental?</summary><p>Os indicadores são normalizados entre as alternativas desta viagem: os pesos iniciais são 50% áreas mapeadas, 30% registros históricos e 20% chuva. Quando algum indicador não tem dados para todos os trajetos, ele é excluído e os demais pesos são redistribuídos. Dados parciais podem ser usados e indicados acima. Os pesos são hipóteses não calibradas; a pontuação não é probabilidade nem pode ser comparada com outra viagem.</p><p>As áreas do GeoSampa têm cobertura limitada. Registros da Defesa Civil são históricos, da camada consultada do ano corrente, e a distância de 100 m é experimental. Nenhum registro encontrado não comprova ausência de risco.</p><p>A chuva é medida nas estações associadas por amostragem a cada 250 m e distância máxima de 3 km. Esses limites são experimentais; a estação não mede a condição de toda a via.</p></details>
    {data.routes.map((route,i)=><details className="real-explanation" key={`rain-${i}`}><summary>Chuva e fontes do trajeto {i+1}</summary><p>SIBH / SP Águas · consulta: {formatDate(route.rain?.queriedAt)} (horário de Brasília). {route.rain?.status==='partial'?'Cobertura ou fonte parcial.':route.rain?.status==='unavailable'?'Dados indisponíveis.':'As medições são pontuais e podem ter períodos diferentes.'}</p>{route.rain?.stations?.length>0 && <ul>{route.rain.stations.map(station=><li key={station.id}>{station.name} · {formatMeasurement(station.value)} mm · de {formatDate(station.start)} até {formatDate(station.end)} · até {Math.round(station.maxDistanceMeters)} m das amostras associadas</li>)}</ul>}<p>Histórico: Defesa Civil / GeoSampa, camada do ano corrente; período e cobertura completos não são garantidos.</p></details>)}
    {selected?.evidence?.length>0 && <div className="real-evidence"><h2>Áreas no trajeto selecionado</h2><ul>{selected.evidence.map((item,i)=><li key={i}>{item.name}{item.classification?` · ${item.classification}`:''} · Vistoria: {item.date || 'data não informada'}</li>)}</ul></div>}<FloodRouteContext context={selected?.floodContext}/><p className="footnote">O Rota Segura apoia sua decisão e não garante a segurança de um caminho.</p>{onDetails && <button className="primary" onClick={onDetails}>Ver detalhes por trecho</button>}
  </>;
}
