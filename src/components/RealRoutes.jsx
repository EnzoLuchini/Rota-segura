import React, {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, LocateFixed, MapPin, Search} from 'lucide-react';
import {request} from './RealLayers';
import FloodRouteContext from './FloodRouteContext';

export function useRealRoutes() {
  const [origin,setOrigin] = useState(null), [destination,setDestination] = useState(null);
  const [routes,setRoutes] = useState([]), [areas,setAreas] = useState([]), [selected,setSelected] = useState(0);
  const [riskAvailable,setRiskAvailable] = useState(false), [message,setMessage] = useState(''), [busy,setBusy] = useState(false);
  const [recommendationReason,setRecommendationReason]=useState(null), [sources,setSources]=useState(null);
  const [water,setWater] = useState(false);
  const [rain,setRain] = useState(false);
  const [risk,setRisk] = useState(true);
  const [history,setHistory] = useState(true);
  const [floodPeriod,setFloodPeriod] = useState(0);
  const routeCache=useRef(new Map()), requestSequence=useRef(0);
  const clear = () => {requestSequence.current++;setBusy(false);setRoutes([]);setAreas([]);setMessage('');setRecommendationReason(null);setSources(null);};
  async function compare(onSuccess) {
    clear();setBusy(true);
    const id=requestSequence.current;
    const key=JSON.stringify([origin.coordinates,destination.coordinates]);
    const cached=routeCache.current.get(key);
    try {
      const reused=!!cached && Date.now()<cached.expiresAt;
      const data = reused ? cached.data : await request('/api/routes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:origin.coordinates,destination:destination.coordinates})});
      if(id!==requestSequence.current)return;
      if(!reused && data.routes.length && data.riskAvailable && data.sources?.rain?.status==='available' && data.routes.every(route=>route.rain?.status==='available' && Number.isFinite(Date.parse(route.rain.validUntil)) && route.floodContext?.history?.status==='available' && route.floodContext?.areas?.[5]?.status==='available')) {
        const now=Date.now(), expiresAt=Math.min(now+120000,...data.routes.map(route=>Date.parse(route.rain.validUntil)));
        if(expiresAt>now){routeCache.current.delete(key);routeCache.current.set(key,{data,time:now,expiresAt});}
        while(routeCache.current.size>5)routeCache.current.delete(routeCache.current.keys().next().value);
      }
      setRoutes(data.routes);setAreas(data.riskAreas || []);setRiskAvailable(data.riskAvailable);setSelected(0);
      setRecommendationReason(data.recommendationReason || null);setSources(data.sources || null);
      setMessage([data.message || (data.excludedOutside?'Algumas alternativas saem do município e foram excluídas.':''),reused?`Resultado reutilizado da consulta das ${new Date(cached.time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}.`:null].filter(Boolean).join(' '));
      if(data.routes.length) onSuccess();
    } catch(error) {if(id===requestSequence.current)setMessage(error.message);} finally {if(id===requestSequence.current)setBusy(false);}
  }
  return {origin,destination,setOrigin,setDestination,routes,areas,selected,setSelected,riskAvailable,recommendationReason,sources,message,busy,water,setWater,rain,setRain,risk,setRisk,history,setHistory,floodPeriod,setFloodPeriod,clear,compare};
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
  return <><div className="search-box"><LocationInput label="Origem" place={data.origin} onChange={v=>{cancelLocation();data.setOrigin(v);data.clear();}}/>
    <div className="real-origin-location"><button className="real-location-button" type="button" onClick={locate} disabled={locating}><LocateFixed size={16}/>{locating?'Obtendo localização…':'Usar minha localização atual'}</button>
    <p className="real-location-note">Usada como origem e enviada ao provedor ao comparar rotas.</p>
    {locationError && <p className="real-input-error" role="status">{locationError}</p>}</div>
    <div className="input-divider"/><LocationInput label="Destino" place={data.destination} onChange={v=>{data.setDestination(v);data.clear();}}/></div>
    <button className="swap-trip" type="button" aria-label="Trocar origem e destino" onClick={()=>{cancelLocation();data.setOrigin(data.destination);data.setDestination(data.origin);data.clear();}}>⇅ Trocar origem e destino</button>
    {data.message && <div className="selection-warning" role="status">{data.message}</div>}
    <button className="primary" disabled={!data.origin || !data.destination || data.busy || locating} onClick={()=>data.compare(onCompare)}><Search size={18}/>{data.busy?'Consultando rotas…':'Comparar rotas'}</button>
  </>;
}

const formatDate=value=>value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}) : 'não informado';
const formatNumber=value=>value.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const formatMeasurement=value=>value.toLocaleString('pt-BR',{maximumFractionDigits:20,useGrouping:false});
const reasonText={
  sources_incomplete:'Não é possível recomendar: uma ou mais fontes estão indisponíveis, incompletas ou sem cobertura técnica.',
  risk_unavailable:'Não é possível recomendar: a fonte de áreas de risco está indisponível.',
  single_route:'Não é possível recomendar: somente uma alternativa foi encontrada.',
  score_tie:'Não há recomendação: as alternativas apresentam empate ou diferença inferior a um ponto.',
  lowest_combined_score:'Recomendação experimental: menor pontuação relativa entre as alternativas desta consulta.'
};

export function RealComparison({data,onBack,onSave}) {
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
  const fastest=Math.min(...data.routes.map(route=>route.summary?.duration ?? Infinity));
  const selected=data.routes[data.selected];
  return <><button className="back" onClick={onBack}><ArrowLeft size={18}/> Voltar ao início</button><span className="overline">Sua viagem</span><h1>Compare suas rotas</h1><p className="intro route-address">{data.origin?.label} <ArrowRight size={15}/> {data.destination?.label}</p>
    {data.message && <div className="selection-warning" role="status">{data.message}</div>}
    {expired ? <div className="selection-warning" role="status">As medições de chuva venceram. Consulte as rotas novamente para atualizar a comparação.</div> : reasonText[data.recommendationReason] && <div className="selection-warning" role="status">{reasonText[data.recommendationReason]}</div>}
    {!data.riskAvailable && <div className="selection-warning" role="status">Dados de risco indisponíveis. Não é possível comparar a exposição.</div>}
    <p className="comparison-hint">Selecione uma alternativa para destacá-la no mapa.</p>
    <div className="route-list real-route-list" role="group" aria-label="Escolha uma rota">{data.routes.map((route,i)=><button className={'route-card '+(data.selected===i?'selected':'')} key={i} onClick={()=>data.setSelected(i)} aria-pressed={data.selected===i}><span className="radio"/><span className="route-content"><span className="route-label">Trajeto {i+1} {data.selected===i && <span className="recommended">Selecionado</span>}</span><span className="route-stats"><strong>{Math.round((route.summary?.duration||0)/60)} min</strong><span>{((route.summary?.distance||0)/1000).toFixed(1)} km{route.summary?.duration===fastest?' · Mais rápida':''}</span></span>
      <small>{route.exposureMeters==null?'Áreas mapeadas indisponíveis':`${formatMeasurement(route.exposureMeters)} m do trajeto em áreas mapeadas`}</small>
      <small>{route.historyCount==null?'Histórico incompleto ou indisponível':`${route.historyCount} registros históricos a até 100 m`}</small>
      <small>{route.rain?.maxMm==null?'Chuva indisponível':`Chuva: ${formatMeasurement(route.rain.maxMm)} mm · ${expired?'medição antiga':route.rain.status==='available'?'estações associadas':'cobertura parcial'}`}</small>
      <small>{expired || route.score==null?'Pontuação indisponível':`${formatNumber(route.score)} pontos · comparação experimental`}</small>
      {!expired && route.recommended && <span className="real-recommended">Menor pontuação relativa nesta consulta</span>}</span></button>)}</div>
    <details className="real-explanation"><summary>Como funciona a comparação experimental?</summary><p>Os indicadores são normalizados entre as alternativas desta viagem: 50% áreas mapeadas, 30% registros históricos e 20% chuva. Os pesos são hipóteses não calibradas; a pontuação não é probabilidade nem pode ser comparada com outra viagem.</p><p>As áreas do GeoSampa têm cobertura limitada. Registros da Defesa Civil são históricos, da camada consultada do ano corrente, e a distância de 100 m é experimental. Nenhum registro encontrado não comprova ausência de risco.</p><p>A chuva é medida nas estações associadas por amostragem a cada 250 m e distância máxima de 3 km. Esses limites são experimentais; a estação não mede a condição de toda a via.</p></details>
    {data.routes.map((route,i)=><details className="real-explanation" key={`rain-${i}`}><summary>Chuva e fontes do trajeto {i+1}</summary><p>SIBH / SP Águas · consulta: {formatDate(route.rain?.queriedAt)} (horário de Brasília). {route.rain?.status==='partial'?'Cobertura ou fonte parcial.':route.rain?.status==='unavailable'?'Dados indisponíveis.':'As medições são pontuais e podem ter períodos diferentes.'}</p>{route.rain?.stations?.length>0 && <ul>{route.rain.stations.map(station=><li key={station.id}>{station.name} · {formatMeasurement(station.value)} mm · de {formatDate(station.start)} até {formatDate(station.end)} · até {Math.round(station.maxDistanceMeters)} m das amostras associadas</li>)}</ul>}<p>Histórico: Defesa Civil / GeoSampa, camada do ano corrente; período e cobertura completos não são garantidos.</p></details>)}
    {selected?.evidence?.length>0 && <div className="real-evidence"><h2>Áreas no trajeto selecionado</h2><ul>{selected.evidence.map((item,i)=><li key={i}>{item.name}{item.classification?` · ${item.classification}`:''} · Vistoria: {item.date || 'data não informada'}</li>)}</ul></div>}<FloodRouteContext context={selected?.floodContext}/><p className="footnote">O Rota Segura apoia sua decisão e não garante a segurança de um caminho.</p><button className="secondary" onClick={onSave}>Salvar como rota frequente</button>
  </>;
}
