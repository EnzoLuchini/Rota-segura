import React from 'react';
import {divIcon} from 'leaflet';
import {CalendarDays, History, MapPin, Navigation, RadioTower} from 'lucide-react';

export const historyKind=type=>type==='INUNDACAO'?'inundação':'alagamento';
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
export function groupHistoryFeatures(features,project,cellSize=48) {
  const groups=new Map();
  for(const feature of features) {
    const [lon,lat]=feature.geometry.coordinates, pixel=project([lon,lat]);
    const key=`${Math.floor(pixel.x/cellSize)}:${Math.floor(pixel.y/cellSize)}`;
    if(!groups.has(key))groups.set(key,{key,features:[],lon:0,lat:0});
    const group=groups.get(key);group.features.push(feature);group.lon+=lon;group.lat+=lat;
  }
  return [...groups.values()].map(group=>({...group,position:[group.lat/group.features.length,group.lon/group.features.length]}));
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
