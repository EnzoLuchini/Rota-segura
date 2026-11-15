import React,{useEffect,useState} from 'react';
import CityModeTabs from './CityModeTabs';
import {formatSourceDate,historyLabel} from './realMapPresentation';

const date=value=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'não informado';
const sourceStatus=value=>({loading:'carregando',available:'disponível',partial:'parcial',unavailable:'indisponível',zoom:'aproxime o mapa'})[value] || 'não consultado';

export default function RealCityPanel({mode,onModeChange,onBack,onLocate,rain={},history={}}) {
  const [alerts,setAlerts]=useState(null),[error,setError]=useState(false),[clock,setClock]=useState(Date.now());
  useEffect(()=>{
    if(mode!=='now')return;
    let active=true,controller;
    async function load(){
      controller?.abort();controller=new AbortController();
      try {const r=await fetch('/api/alerts',{signal:controller.signal});if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data.alerts) || !['available','partial'].includes(data.status))throw Error();if(active){setAlerts(data);setError(false);setClock(Date.now());}}
      catch(e){if(active && e.name!=='AbortError'){setAlerts(null);setError(true);}}
    }
    load();const refresh=setInterval(load,120000),tick=setInterval(()=>setClock(Date.now()),30000);
    return()=>{active=false;controller?.abort();clearInterval(refresh);clearInterval(tick);};
  },[mode]);
  const current=(alerts?.alerts || []).filter(item=>Date.parse(item.start)<=clock && clock<Date.parse(item.end));
  return <>
    <button className="back" onClick={onBack}>← Voltar para rotas</button>
    <span className="overline">Explore a cidade</span><h1>Situação da cidade</h1>
    <p className="intro">Consulte as informações disponíveis sem montar uma rota.</p>
    <div className="city-tabs-desktop"><CityModeTabs mode={mode} onModeChange={onModeChange}/></div>
    {mode==='now'?<>
      <p className="city-explanation">Chuva e avisos meteorológicos não confirmam alagamento em uma via. Consulte os pontos atuais diretamente no CGE.</p>
      <a href="https://www.cgesp.org/v3/alagamentos.jsp" target="_blank" rel="noopener noreferrer">Consultar pontos de alagamento no CGE ↗</a>
      <div className="city-list"><h2>Chuva observada nas estações</h2>
        {rain.status==='disabled' && <p>Ative a camada de chuva para consultar as estações.</p>}
        {rain.status==='loading' && <p role="status">Consultando chuva observada…</p>}
        {rain.status==='unavailable' && <p role="status">Chuva observada indisponível no momento.</p>}
        {rain.status==='partial' && <p>Consulta parcial; cobertura limitada.</p>}
        {['available','partial'].includes(rain.status) && <><p className="footnote">SIBH / SP Águas · consulta: {date(rain.queriedAt)}. Medições pontuais não representam toda a via.</p>{rain.stations?.length===0 && <p>Nenhuma medição disponível; isso não indica ausência de chuva.</p>}{rain.stations?.length>0 && <details className="real-explanation"><summary>Ver {rain.stations.length} estações consultadas</summary>{rain.stations.map(s=><div className="city-event" key={s.id}><button onClick={()=>onLocate?.({position:[s.coordinates[1],s.coordinates[0]],id:s.id})}>{s.name} · {s.value.toLocaleString('pt-BR')} mm {s.stale?'· medição antiga':''}</button><small>De {date(s.start)} até {date(s.end)} · SIBH</small></div>)}</details>}</>}
      </div>
      <div className="city-list"><h2>Avisos meteorológicos</h2>
        {error?<p role="status">Avisos do INMET indisponíveis no momento.</p>:!alerts?<p role="status">Consultando avisos do INMET…</p>:<><p className="footnote">INMET · consulta: {date(alerts.checkedAt)}. Cobertura do feed não confirmada.</p>{alerts.status==='partial' && <p>Consulta parcial.</p>}{current.length===0?<p>Nenhum aviso vigente encontrado entre os itens consultados; isso não garante ausência de risco.</p>:current.map((item,i)=><article className="city-event" key={`${item.id}-${i}`}><strong>{item.headline}</strong><p>Até {date(item.end)} · INMET</p><a href={item.url} target="_blank" rel="noopener noreferrer">Abrir aviso oficial</a></article>)}</>}
      </div>
    </>:<>
      <p className="city-explanation">Histórico da Defesa Civil / GeoSampa: não representa alagamento atual. A cobertura pode ser incompleta e a atualização não é imediata.</p>
      <p role="status">{history.status}</p>
      <p className="footnote">Alagamento: {sourceStatus(history.sourceStates?.alagamento)} · Inundação: {sourceStatus(history.sourceStates?.inundacao)} · Consulta: {date(history.queriedAt)}</p>
      <div className="city-list"><h2>Registros na área visível</h2>{history.features?.length===0 && <p>Nenhum registro exibido nesta área. Isso não garante ausência de risco.</p>}{history.features?.map((feature,index)=>{const p=feature.properties || {};return <div className="city-event" key={`${feature.kind}-${feature.id ?? index}`}><button onClick={()=>onLocate?.({id:feature.id,position:[feature.geometry.coordinates[1],feature.geometry.coordinates[0]]})}>{historyLabel(p.dc_tipo_ocorrencia || (feature.kind==='inundacao'?'INUNDACAO':'ALAGAMENTO'))} · {p.nm_subprefeitura || 'local não informado'}</button><small>Ocorrência: {formatSourceDate(p.dt_ocorrencia)} · Carga: {formatSourceDate(p.dt_carga)}</small></div>;})}</div>
    </>}
    <button className="secondary" onClick={onBack}>Montar uma rota</button>
  </>;
}
