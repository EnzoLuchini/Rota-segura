import React, {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, LocateFixed, MapPin, Search} from 'lucide-react';
import {request} from './RealLayers';
import FloodRouteContext from './FloodRouteContext';

export function useRealRoutes() {
  const [origin,setOrigin] = useState(null), [destination,setDestination] = useState(null);
  const [routes,setRoutes] = useState([]), [areas,setAreas] = useState([]), [selected,setSelected] = useState(0);
  const [riskAvailable,setRiskAvailable] = useState(false), [message,setMessage] = useState(''), [busy,setBusy] = useState(false);
  const [water,setWater] = useState(true);
  const [risk,setRisk] = useState(true);
  const [history,setHistory] = useState(false);
  const [floodPeriod,setFloodPeriod] = useState(0);
  const routeCache=useRef(new Map()), requestSequence=useRef(0);
  const clear = () => {requestSequence.current++;setBusy(false);setRoutes([]);setAreas([]);setMessage('');};
  async function compare(onSuccess) {
    clear();setBusy(true);
    const id=requestSequence.current;
    const key=JSON.stringify([origin.coordinates,destination.coordinates]);
    const cached=routeCache.current.get(key);
    try {
      const reused=!!cached && Date.now()-cached.time<120000;
      const data = reused ? cached.data : await request('/api/routes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:origin.coordinates,destination:destination.coordinates})});
      if(id!==requestSequence.current)return;
      if(!reused && data.routes.length && data.riskAvailable && data.routes.every(route=>route.floodContext?.history?.status==='available' && route.floodContext?.areas?.[5]?.status==='available')) {
        routeCache.current.delete(key);routeCache.current.set(key,{data,time:Date.now()});
        while(routeCache.current.size>5)routeCache.current.delete(routeCache.current.keys().next().value);
      }
      setRoutes(data.routes);setAreas(data.riskAreas || []);setRiskAvailable(data.riskAvailable);setSelected(0);
      setMessage([data.message || (data.excludedOutside?'Algumas alternativas saem do município e foram excluídas.':''),reused?`Resultado reutilizado da consulta das ${new Date(cached.time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}.`:null].filter(Boolean).join(' '));
      if(data.routes.length) onSuccess();
    } catch(error) {if(id===requestSequence.current)setMessage(error.message);} finally {if(id===requestSequence.current)setBusy(false);}
  }
  return {origin,destination,setOrigin,setDestination,routes,areas,selected,setSelected,riskAvailable,message,busy,water,setWater,risk,setRisk,history,setHistory,floodPeriod,setFloodPeriod,clear,compare};
}

function LocationInput({label,place,onChange}) {
  const [text,setText]=useState(place?.label || ''), [items,setItems]=useState([]), [error,setError]=useState(''), [loading,setLoading]=useState(false);
  React.useEffect(()=>{if(place) setText(place.label);},[place]);
  async function search(){setLoading(true);setError('');setItems([]);try {const data=await request(`/api/places?q=${encodeURIComponent(text)}`);setItems(data.places);if(!data.places.length)setError('Nenhum local encontrado em São Paulo.');}catch(e){setError(e.message);}finally{setLoading(false);}}
  return <><div className="input-row real-input-row">{label==='Origem'?<span className="point start"/>:<MapPin size={19} className="dest-icon"/>}<label><small>{label}</small><input aria-label={label} value={text} placeholder="Digite um endereço" onChange={e=>{setText(e.target.value);onChange(null);setItems([]);}}/></label><button className="real-search-button" type="button" onClick={search} disabled={loading}>{loading?'Buscando…':'Buscar'}</button></div>{error && <p role="status" className="real-input-error">{error}</p>}{items.length>0 && <ul className="real-place-results">{items.map((item,i)=><li key={i}><button type="button" onClick={()=>{setText(item.label);onChange(item);setItems([]);}}>{item.label}</button></li>)}</ul>}</>;
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
  return <><div className="search-box"><LocationInput label="Origem" place={data.origin} onChange={v=>{cancelLocation();data.setOrigin(v);data.clear();}}/><div className="input-divider"/><LocationInput label="Destino" place={data.destination} onChange={v=>{data.setDestination(v);data.clear();}}/></div>
    <button className="real-location-button" type="button" onClick={locate} disabled={locating}><LocateFixed size={16}/>{locating?'Obtendo localização…':'Usar minha localização atual'}</button>
    <p className="real-location-note">A localização será usada como origem e enviada ao provedor ao comparar rotas.</p>
    {locationError && <p className="real-input-error" role="status">{locationError}</p>}
    <button className="swap-trip" type="button" aria-label="Trocar origem e destino" onClick={()=>{cancelLocation();data.setOrigin(data.destination);data.setDestination(data.origin);data.clear();}}>⇅ Trocar origem e destino</button>
    {data.message && <div className="selection-warning" role="status">{data.message}</div>}
    <button className="primary" disabled={!data.origin || !data.destination || data.busy || locating} onClick={()=>data.compare(onCompare)}><Search size={18}/>{data.busy?'Consultando rotas…':'Comparar rotas'}</button>
  </>;
}

export function RealComparison({data,onBack}) {
  const fastest=Math.min(...data.routes.map(route=>route.summary?.duration ?? Infinity));
  const selected=data.routes[data.selected];
  return <><button className="back" onClick={onBack}><ArrowLeft size={18}/> Voltar ao início</button><span className="overline">Sua viagem</span><h1>Compare suas rotas</h1><p className="intro route-address">{data.origin?.label} <ArrowRight size={15}/> {data.destination?.label}</p>
    {data.message && <div className="selection-warning" role="status">{data.message}</div>}{!data.riskAvailable && <div className="selection-warning" role="status">Dados de risco indisponíveis. Não é possível comparar a exposição.</div>}
    <p className="comparison-hint">Selecione uma alternativa para destacá-la no mapa.</p><div className="route-list" role="group" aria-label="Escolha uma rota">{data.routes.map((route,i)=><button className={'route-card '+(data.selected===i?'selected':'')} key={i} onClick={()=>data.setSelected(i)} aria-pressed={data.selected===i}><span className="radio"/><span className="route-content"><span className="route-label">Trajeto {i+1} {data.selected===i && <span className="recommended">Selecionado</span>}</span><span className="route-stats"><strong>{Math.round((route.summary?.duration||0)/60)} min</strong><span>{((route.summary?.distance||0)/1000).toFixed(1)} km{route.summary?.duration===fastest?' · Mais rápida':''}</span></span><small>{route.exposureMeters===null?'Exposição indisponível':`${Math.round(route.exposureMeters)} m do trajeto em áreas mapeadas`}</small>{route.recommended && <span className="real-recommended">Menor exposição conhecida nesta camada</span>}</span></button>)}</div>
    <details className="real-explanation"><summary>O que significam os metros em áreas mapeadas?</summary><p>É a parte do trajeto que cruza áreas de risco hidrológico do GeoSampa, mapeadas em assentamentos precários. Áreas sobrepostas são contadas uma vez.</p><p>Zero metros significa que o trajeto não cruza áreas desta camada; não significa ausência de risco. A cobertura é limitada e não informa alagamentos em tempo real.</p></details>
    {selected?.evidence?.length>0 && <div className="real-evidence"><h2>Áreas no trajeto selecionado</h2><ul>{selected.evidence.map((item,i)=><li key={i}>{item.name}{item.classification?` · ${item.classification}`:''} · Vistoria: {item.date || 'data não informada'}</li>)}</ul></div>}<FloodRouteContext context={selected?.floodContext}/><p className="footnote">O Rota Segura apoia sua decisão e não garante a segurança de um caminho.</p>
  </>;
}
