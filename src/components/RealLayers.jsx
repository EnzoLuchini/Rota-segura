import React, {useEffect, useRef, useState} from 'react';
import {GeoJSON, ImageOverlay, Polyline, Circle, Marker, Popup, useMap, useMapEvents} from 'react-leaflet';
import {historyIcon,historyLabel,historyGroupIcon,groupHistoryFeatures,mergeHistoryFeatures,HistoryCard} from './realMapPresentation';
import {createMapRequestCache} from './mapRequestCache';
import {bufferBox, findCoverage} from './mapViewportCache';

const mapCache=createMapRequestCache();
const cachedMapRequest=url=>mapCache.get(url,()=>request(url));
const roundedBounds=b=>[Math.floor(Math.max(-46.95,b.getWest())*1e5)/1e5,Math.floor(Math.max(-24.1,b.getSouth())*1e5)/1e5,Math.ceil(Math.min(-46.30,b.getEast())*1e5)/1e5,Math.ceil(Math.min(-23.3,b.getNorth())*1e5)/1e5];

export async function request(url, options) {
  let response, data;
  try {
    response = await fetch(url,options);
    data = await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível consultar os dados. Tente novamente.');
  }
  if (!response.ok) throw new Error(data.error || 'Não foi possível consultar os dados.');
  return data;
}
export function Waterways({enabled}) {
  const [data,setData] = useState(null);
  const [status,setStatus] = useState('');
  const sequence = useRef(0);
  const coverage = useRef([]);
  const map = useMapEvents({moveend:load});
  function load() {
    if (!enabled || !map) return;
    const id = ++sequence.current;
    const b=map.getBounds();
    const box=roundedBounds(b);
    if(box[2]-box[0]>0.3 || box[3]-box[1]>0.3 || box[2]<=box[0] || box[3]<=box[1]) { setData(null); setStatus('Aproxime o mapa de São Paulo para ver rios e córregos.'); return; }
    const cached=findCoverage(coverage.current,box,null,Date.now());
    if(cached){setData(cached.data);setStatus('');return;}
    const expanded=bufferBox(box);
    setStatus('Carregando rios e córregos…');
    cachedMapRequest(`/api/streams?bbox=${expanded.join(',')}`).then(value => {if(id!==sequence.current)return;if(!value.truncated)coverage.current=[{box:expanded,data:value,time:Date.now()},...coverage.current].slice(0,5);setData(value);setStatus(value.truncated ? 'Camada parcialmente exibida; aproxime o mapa.' : '');}).catch(() => {if(id!==sequence.current)return;setData(null);setStatus('Rios e córregos indisponíveis no momento.');});
  }
  useEffect(() => { if (map && enabled) load(); else {sequence.current++;setData(null);setStatus('');} return () => {sequence.current++;}; },[map,enabled]);
  useEffect(() => { const node=document.getElementById('water-status'); if(node) node.textContent=status; },[status]);
  if (!enabled || !data?.features?.length) return null;
  return <GeoJSON key={JSON.stringify(data.features.map(f=>f.id))} data={data} style={f => ({color:'#1687b3',weight:3,opacity:0.8,dashArray:f.properties?.nm_tipo_curso_hidrografia?.toLowerCase().includes('subterrâneo')?'5 6':null})} onEachFeature={(feature,layer) => {const node=document.createElement('div');node.textContent=[feature.properties?.nm_descritivo || feature.properties?.nm_acidente || 'Trecho de drenagem',feature.properties?.nm_tipo_curso_hidrografia,'Fonte: GeoSampa / Prefeitura de São Paulo'].filter(Boolean).join(' · ');layer.bindPopup(node);}}/>;
}
export function FitRoutes({routes}) {
  const map=useMap();
  useEffect(() => {if(routes.length) {const points=routes.flatMap(r=>r.geometry.coordinates.map(([lon,lat])=>[lat,lon]));if(points.length) {map.invalidateSize({animate:false,pan:false});map.fitBounds(points,{padding:[35,35],animate:false});}}},[map,routes]);
  return null;
}

export function HistoricalOccurrences({enabled,routeEvents=[]}) {
  const [data,setData]=useState(null), [status,setStatus]=useState('');
  const [zoom,setZoom]=useState(null);
  const [reference,setReference]=useState(null);
  const sequence=useRef(0);
  const coverage=useRef([]);
  const map=useMapEvents({moveend:load});
  function load() {
    if (!map) return;
    setZoom(map.getZoom());
    if (!enabled) return;
    const id=++sequence.current, b=map.getBounds();
    const box=roundedBounds(b);
    if(box[2]-box[0]>0.3 || box[3]-box[1]>0.3 || box[2]<=box[0] || box[3]<=box[1]) {setData(null);setStatus('Aproxime o mapa de São Paulo para ver os registros históricos.');return;}
    const cached=findCoverage(coverage.current,box,null,Date.now());
    if(cached){setData(cached.data);setStatus(cached.data.features.length?'':'Nenhum registro disponível nesta área da camada.');return;}
    const expanded=bufferBox(box);
    setStatus('Carregando registros históricos…');
    Promise.allSettled(['alagamento','inundacao'].map(kind=>cachedMapRequest(`/api/occurrences?bbox=${expanded.join(',')}&kind=${kind}`))).then(results=>{if(id!==sequence.current)return;const available=results.filter(result=>result.status==='fulfilled').map(result=>result.value);if(!available.length){setData(null);setStatus('Registros históricos indisponíveis no momento.');return;}const features=available.flatMap(value=>value.features),next={features};if(available.length===2 && !available.some(value=>value.truncated))coverage.current=[{box:expanded,data:next,time:Date.now()},...coverage.current].slice(0,5);setData(next);setStatus(available.length<2 || available.some(value=>value.truncated)?'Registros parcialmente exibidos; uma fonte falhou ou limitou os dados.':features.length?'':'Nenhum registro disponível nesta área da camada.');});
  }
  useEffect(()=>{if(map && enabled)load();else {sequence.current++;setData(null);setStatus('');setReference(null);}return()=>{sequence.current++;};},[map,enabled]);
  useEffect(()=>{const node=document.getElementById('history-status');if(node)node.textContent=status;},[status]);
  if(!map)return null;
  const features=mergeHistoryFeatures(enabled ? (data?.features || []) : [],routeEvents);
  if(!features.length)return null;
  const groups=groupHistoryFeatures(features,([lon,lat])=>map.project([lat,lon],zoom ?? map.getZoom()));
  return <>{reference && <HistoryReference coordinates={reference}/>}{groups.map(group=>{
    if(group.features.length===1){const feature=group.features[0],p=feature.properties || {};return <Marker key={feature.id} position={group.position} icon={historyIcon(p.dc_tipo_ocorrencia)} title={historyLabel(p.dc_tipo_ocorrencia)} alt={historyLabel(p.dc_tipo_ocorrencia)} eventHandlers={{popupopen:()=>setReference(feature.geometry.coordinates),popupclose:()=>setReference(null)}}><Popup className="real-history-popup" autoPanPaddingTopLeft={[20,115]} autoPanPaddingBottomRight={[20,110]}><HistoryCard type={p.dc_tipo_ocorrencia} date={p.dt_ocorrencia} loadedAt={p.dt_carga} location={p.nm_subprefeitura} distanceMeters={p.distanceMeters}/></Popup></Marker>;}
    const label=`${group.features.length} registros históricos próximos`;
    return <Marker key={group.key} position={group.position} icon={historyGroupIcon(group.features.length)} title={label} alt={label} ref={layer=>layer?.getElement()?.setAttribute('aria-label',label)} eventHandlers={{popupclose:()=>setReference(null)}}><Popup className="real-history-popup" autoPanPaddingTopLeft={[20,115]} autoPanPaddingBottomRight={[20,110]}><div className="real-history-group"><div className="real-history-group__heading"><strong>{label}</strong><span>Registros anteriores, não ocorrências atuais. Aproxime o mapa para ver pontos individuais.</span></div><div className="real-history-group__list">{group.features.map(feature=>{const p=feature.properties || {};return <HistoryCard key={feature.id} type={p.dc_tipo_ocorrencia} date={p.dt_ocorrencia} loadedAt={p.dt_carga} location={p.nm_subprefeitura} distanceMeters={p.distanceMeters} onShowReference={()=>setReference(feature.geometry.coordinates)}/>;})}</div></div></Popup></Marker>;
  })}</>;
}

function HistoryReference({coordinates}) {
  return <Circle center={[coordinates[1],coordinates[0]]} radius={100} pathOptions={{color:'#bb6f13',weight:2,dashArray:'6 5',fillColor:'#efb34e',fillOpacity:.14,interactive:false}}/>;
}

export function FloodAreas({period}) {
  const [status,setStatus]=useState(''),[image,setImage]=useState(null);
  const sequence=useRef(0);
  const coverage=useRef([]);
  const map=useMapEvents({moveend:load});
  function load(){
    if(period!==5 || !map)return;
    const id=++sequence.current,viewport=map.getBounds(), size=map.getSize(),zoom=map.getZoom();
    const visible=[viewport.getWest(),viewport.getSouth(),viewport.getEast(),viewport.getNorth()];
    const cached=findCoverage(coverage.current,visible,zoom,Date.now());
    if(cached){setImage(cached.image);setStatus(zoom<9?'Aproxime o mapa para visualizar o cenário de inundação.':'');return;}
    const bounds=viewport.pad(0.5);
    const sw=map.options.crs.project(bounds.getSouthWest()),ne=map.options.crs.project(bounds.getNorthEast());
    const scale=Math.min(2,2048/Math.max(size.x,size.y));
    const url=new URL('https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wms');
    Object.entries({service:'WMS',version:'1.1.1',request:'GetMap',layers:'geoportal:mancha_inundacao_5',styles:'polygon',srs:'EPSG:3857',bbox:[sw.x,sw.y,ne.x,ne.y].join(','),width:Math.max(1,Math.round(size.x*scale)),height:Math.max(1,Math.round(size.y*scale)),format:'image/png',transparent:'true'}).forEach(([key,value])=>url.searchParams.set(key,value));
    setStatus('Atualizando manchas; a área exibida pode estar incompleta.');
    const pending=new Image();
    pending.onload=()=>{if(id!==sequence.current)return;const next={url:url.toString(),bounds};coverage.current=[{box:[bounds.getWest(),bounds.getSouth(),bounds.getEast(),bounds.getNorth()],zoom,time:Date.now(),image:next},...coverage.current].slice(0,5);setImage(next);setStatus(zoom<9?'Aproxime o mapa para visualizar o cenário de inundação.':'');};
    pending.onerror=()=>{if(id!==sequence.current)return;setStatus('Manchas indisponíveis para a área atual. Tente novamente mais tarde.');};
    pending.src=url.toString();
  }
  useEffect(()=>{if(period===5 && map)load();else {sequence.current++;setImage(null);setStatus('');}return()=>{sequence.current++;};},[period,map]);
  useEffect(()=>{const node=document.getElementById('flood-status');if(node)node.textContent=status;},[status]);
  if(period!==5 || !image)return null;
  return <ImageOverlay url={image.url} bounds={image.bounds} opacity={0.7} className="flood-wms-image" interactive={false} attribution="Manchas de inundação: GeoSampa / Prefeitura de São Paulo"/>;
}

export function RouteFloodHighlights({route,showMarkers=true}) {
  const [reference,setReference]=useState(null);
  useEffect(()=>setReference(null),[route]);
  if(!route?.floodContext)return null;
  const {history,areas}=route.floodContext, coordinates=route.geometry.coordinates;
  const segments=[...new Set(Object.values(areas).flatMap(area=>area.segmentIndexes))];
  return <>
    {reference && <HistoryReference coordinates={reference}/>}
    {segments.map(i=><Polyline key={i} positions={coordinates.slice(i,i+2).map(([lon,lat])=>[lat,lon])} pathOptions={{color:'#8f3e9c',weight:7,dashArray:'7 6'}}><Popup>Trecho que cruza mancha de inundação potencial. Consulte os períodos no detalhe da rota.</Popup></Polyline>)}
    {showMarkers && history.events.map((event,i)=><Marker key={`${event.id}-${i}`} position={[event.coordinates[1],event.coordinates[0]]} icon={historyIcon(event.type)} title={historyLabel(event.type)} alt={historyLabel(event.type)} eventHandlers={{popupopen:()=>setReference(event.coordinates),popupclose:()=>setReference(null)}}><Popup className="real-history-popup" autoPanPaddingTopLeft={[20,115]} autoPanPaddingBottomRight={[20,110]}><HistoryCard type={event.type} date={event.date} loadedAt={event.loadedAt} distanceMeters={event.distanceMeters}/></Popup></Marker>)}
  </>;
}
