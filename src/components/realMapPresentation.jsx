import React from 'react';
import {divIcon} from 'leaflet';
import {CalendarDays, History, MapPin, Navigation, RadioTower} from 'lucide-react';

export const historyKind=type=>type==='INUNDACAO'?'inundação':'alagamento';
export const historyKey=feature=>feature.id==null?null:JSON.stringify([feature.kind || (feature.type==='INUNDACAO' || feature.properties?.dc_tipo_ocorrencia==='INUNDACAO'?'inundacao':'alagamento'),String(feature.id)]);
export function formatSourceDate(value) {
  const match=typeof value==='string' && /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Não informada';
}

const symbols={
  alagamento:'<path d="M12 3C9 7 6.5 9.5 6.5 13a5.5 5.5 0 0 0 11 0C17.5 9.5 15 7 12 3Z"/><path d="M9.5 14.5c.3 1.1 1.2 1.8 2.5 1.9"/>',
  inundação:'<path d="M3 8c2-2 4 2 6 0s4 2 6 0 4 2 6 0M3 13c2-2 4 2 6 0s4 2 6 0 4 2 6 0M3 18c2-2 4 2 6 0s4 2 6 0 4 2 6 0"/>',
};
const icons=Object.fromEntries(Object.entries(symbols).map(([kind,path])=>[kind,divIcon({
  className:'real-history-marker-shell',
  html:`<span class="real-history-marker real-history-marker--${kind==='inundação'?'inundation':'flood'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg><span class="real-history-marker__badge" aria-hidden="true">H</span></span>`,
  iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-17],
})]));
export const historyIcon=type=>icons[historyKind(type)];
export const historyLabel=type=>`Registro histórico de ${historyKind(type)}`;
// Agrupa pela distância entre os centros projetados, inclusive nas bordas da grade.
// Repete após mover o centro de um grupo para que os próprios grupos não colidam.
export function groupHistoryFeatures(features,project,spacing=52) {
  let groups=features.map((feature,index)=>{
    const [lon,lat]=feature.geometry.coordinates;
    const pixel=project([lon,lat]);
    return {features:[feature],lon,lat,x:pixel.x,y:pixel.y,count:1,index};
  });
  let merged;
  do {
    merged=false;
    const buckets=new Map(), next=[];
    for(const group of groups) {
      const gx=Math.floor(group.x/spacing), gy=Math.floor(group.y/spacing);
      let target;
      for(let dx=-1;dx<=1 && !target;dx++) for(let dy=-1;dy<=1 && !target;dy++) {
        target=(buckets.get(`${gx+dx}:${gy+dy}`) || []).find(other=>Math.abs(other.x-group.x)<spacing && Math.abs(other.y-group.y)<spacing);
      }
      if(target) {
        target.features.push(...group.features);
        target.lon+=group.lon;target.lat+=group.lat;
        target.x=(target.x*target.count+group.x*group.count)/(target.count+group.count);
        target.y=(target.y*target.count+group.y*group.count)/(target.count+group.count);
        target.count+=group.count;
        merged=true;
      } else {
        const copy={...group,features:[...group.features]};
        next.push(copy);
        const key=`${gx}:${gy}`;
        if(!buckets.has(key))buckets.set(key,[]);
        buckets.get(key).push(copy);
      }
    }
    groups=next;
  } while(merged);
  return groups.map(group=>({...group,key:group.features.map((feature,i)=>historyKey(feature) ?? `${group.index}-${i}`).join('|'),position:[group.lat/group.count,group.lon/group.count]}));
}

export function mergeHistoryFeatures(mapFeatures,routeEvents) {
  const result=[...mapFeatures], indices=new Map();
  result.forEach((feature,index)=>{const key=historyKey(feature);if(key!==null)indices.set(key,index);});
  for(const event of routeEvents) {
    const key=historyKey(event);
    const index=key===null ? undefined : indices.get(key);
    const existing=index === undefined ? null : result[index];
    const feature={...existing,id:event.id,kind:event.kind || existing?.kind,geometry:existing?.geometry || {type:'Point',coordinates:event.coordinates},properties:{...existing?.properties,dc_tipo_ocorrencia:event.type ?? existing?.properties?.dc_tipo_ocorrencia,dt_ocorrencia:event.date ?? existing?.properties?.dt_ocorrencia,dt_carga:event.loadedAt ?? existing?.properties?.dt_carga,distanceMeters:event.distanceMeters}};
    if(index === undefined) {if(key!==null)indices.set(key,result.length);result.push(feature);} else result[index]=feature;
  }
  return result;
}
export function historyGroupIcon(count) {
  return divIcon({className:'real-history-marker-shell',html:`<span class="real-history-cluster" aria-hidden="true"><span>${Number(count)}</span><small>H</small></span>`,iconSize:[38,38],iconAnchor:[19,19],popupAnchor:[0,-19]});
}

export function HistoryCard({type,date,loadedAt,location,distanceMeters,onShowReference}) {
  const kind=historyKind(type);
  return <article className="real-history-card">
    <div className="real-history-card__eyebrow"><History size={13} aria-hidden="true"/> Histórico</div>
    <h3>{kind==='inundação'?'Inundação registrada':'Alagamento registrado'}</h3>
    <p className="real-history-card__note">Registro anterior, não indica uma ocorrência atual.</p>
    <div className="real-history-card__details">
      <span><CalendarDays size={14} aria-hidden="true"/> Ocorrência: <strong>{formatSourceDate(date)}</strong></span>
      {location && <span><MapPin size={14} aria-hidden="true"/> {location}</span>}
      {Number.isFinite(distanceMeters) && <span><Navigation size={14} aria-hidden="true"/> A {Math.round(distanceMeters)} m da rota</span>}
      <span><RadioTower size={14} aria-hidden="true"/> Defesa Civil · GeoSampa</span>
    </div>
    <div className="real-history-card__updated">Dados carregados pela fonte: {formatSourceDate(loadedAt)}</div>
    {onShowReference && <button type="button" className="history-reference-button" onClick={onShowReference}>Destacar referência no mapa</button>}
    <p className="real-history-card__reference">Círculo de 100 m: referência visual; não representa a extensão real da inundação.</p>
  </article>;
}
