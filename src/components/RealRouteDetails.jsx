import React,{useEffect,useState} from 'react';
import {buildRouteSegments} from '../data/realRouteSegments';
import {formatSourceDate} from './realMapPresentation';

const date=value=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'não informado';
export default function RealRouteDetails({route,riskAreas,riskAvailable,selectedSegment,setSelectedSegment,onBack}) {
  const [clock,setClock]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),15000);return()=>clearInterval(timer);},[]);
  const segments=buildRouteSegments(route,riskAvailable?riskAreas:null), selected=segments[selectedSegment] || segments[0];
  const expiry=Date.parse(route?.rain?.readingsValidUntil);
  const expired=!Number.isFinite(expiry) || clock>=expiry;
  if(!selected)return <><button className="back" onClick={onBack}>← Voltar</button><h1>Detalhes por trecho</h1><p>Geometria indisponível.</p></>;
  const stations=route.rain?.stations || [];
  return <>
    <button className="back" onClick={onBack}>← Voltar para comparação</button><span className="overline">Trajeto selecionado</span><h1>Detalhes por trecho</h1>
    <p className="intro">Trechos aproximados ao longo da geometria da rota. A pontuação compara a viagem inteira e não classifica cada trecho.</p>
    <label className="form-field">Selecionar trecho<select value={Math.min(selectedSegment,segments.length-1)} onChange={event=>setSelectedSegment(Number(event.target.value))}>{segments.map((segment,i)=><option value={i} key={i}>Trecho {i+1} · {(segment.startKm*1000).toFixed(0)}–{(segment.endKm*1000).toFixed(0)} m</option>)}</select></label>
    <h2>Trecho {Math.min(selectedSegment,segments.length-1)+1}</h2>
    <p>{selected.riskCrossing===null?'Áreas de risco indisponíveis.':selected.riskCrossing?'A geometria cruza área de risco mapeada pelo GeoSampa.':'Nenhum cruzamento encontrado nas áreas de risco consultadas; a cobertura é limitada.'}</p>
    <h3>Registros históricos próximos</h3>
    {route.floodContext?.history?.status!=='available' && <p>Histórico parcial ou indisponível para a rota.</p>}
    {selected.events.length?selected.events.map((event,i)=><p key={`${event.kind}-${event.id}-${i}`}>{event.type || event.kind || 'Ocorrência'} · {formatSourceDate(event.date)}{Number.isFinite(event.distanceMeters)?` · a ${Math.round(event.distanceMeters)} m da rota`:''} · Defesa Civil / GeoSampa</p>):<p>Nenhum registro associado a este trecho entre os dados consultados; isso não garante ausência de risco.</p>}
    <h3>Chuva observada</h3>
    {expired?<p>Medição antiga ou indisponível. Refaça a consulta para atualizar.</p>:!selected.samples.length?<p>Não há amostra de chuva neste intervalo; isso não indica ausência de chuva.</p>:<>{route.rain?.status==='partial' && <p>Cobertura ou fonte parcial.</p>}{selected.samples.map((sample,i)=>{const station=stations.find(s=>s.id===sample.stationId);return <p key={i}>{station?`${station.name}: ${station.value.toLocaleString('pt-BR')} mm · estação a ${Math.round(sample.stationDistanceMeters)} m da amostra · de ${date(station.start)} até ${date(station.end)}`:'Amostra sem cobertura de estação válida.'}</p>;})}<p className="footnote">SIBH / SP Águas. A medição é da estação, não da via.</p></>}
    <h3>Mancha de inundação modelada</h3><p>{route.floodContext?.areas?.[5]?.status==='available'?'A consulta identifica cruzamentos na geometria original, sem localização exata por trecho. O cenário de retorno de 5 anos não é previsão atual.':'Consulta da mancha parcial ou indisponível.'}</p>
    <p className="footnote">A ausência de registros não garante segurança.</p>
  </>;
}
