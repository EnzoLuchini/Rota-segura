import React, {useEffect, useRef, useState} from 'react';
import {GeoJSON, useMap, useMapEvents} from 'react-leaflet';

export async function request(url, options) {
  const response = await fetch(url,options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível consultar os dados.');
  return data;
}
export function Waterways({enabled}) {
  const [data,setData] = useState(null);
  const [status,setStatus] = useState('');
  const sequence = useRef(0);
  const map = useMapEvents({moveend:load});
  function load() {
    if (!enabled || !map) return;
    const id = ++sequence.current;
    const b=map.getBounds();
    const box=[Math.max(-46.95,b.getWest()),Math.max(-24.1,b.getSouth()),Math.min(-46.30,b.getEast()),Math.min(-23.3,b.getNorth())];
    if(box[2]-box[0]>0.3 || box[3]-box[1]>0.3 || box[2]<=box[0] || box[3]<=box[1]) { setData(null); setStatus('Aproxime o mapa de São Paulo para ver rios e córregos.'); return; }
    setStatus('Carregando rios e córregos…');
    request(`/api/streams?bbox=${box.join(',')}`).then(value => {if(id!==sequence.current)return;setData(value);setStatus(value.truncated ? 'Camada parcialmente exibida; aproxime o mapa.' : '');}).catch(() => {if(id!==sequence.current)return;setData(null);setStatus('Rios e córregos indisponíveis no momento.');});
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
