import React, {useState} from 'react';
import {divIcon} from 'leaflet';
import {Marker, Popup, useMapEvents} from 'react-leaflet';
import {groupHistoryFeatures} from './realMapPresentation';

function groupIcon(count) {
  return divIcon({className:'city-marker-shell',html:`<span class="city-cluster" aria-hidden="true">${Number(count)}</span>`,iconSize:[38,38],iconAnchor:[19,19],popupAnchor:[0,-19]});
}

export default function ScenarioMarkers({events,icons,markers}) {
  const [zoom,setZoom]=useState(null);
  const map=useMapEvents({zoomend:()=>setZoom(map.getZoom())});
  const features=events.map(event=>({id:event.id,geometry:{coordinates:[event.position[1],event.position[0]]},event}));
  const groups=map ? groupHistoryFeatures(features,([lon,lat])=>map.project([lat,lon],zoom ?? map.getZoom())) : features.map(feature=>({key:feature.id,position:feature.event.position,features:[feature]}));
  return groups.map(group=>{
    const items=group.features.map(feature=>feature.event);
    const title=items.length===1 ? items[0].title : `${items.length} avisos simulados próximos`;
    return <Marker key={group.key} ref={marker=>{for(const item of items){if(marker)markers.current[item.id]=marker;else delete markers.current[item.id];}}} position={group.position} icon={items.length===1 ? (icons[items[0].kind] || icons.flood) : groupIcon(items.length)} title={title} alt={title}>
      <Popup className="city-group-popup">{items.length>1 && <strong>{title}</strong>}{items.map(item=><div key={item.id} className="city-group-item"><strong>{item.title}</strong><br/>{item.detail}<br/>{item.source}</div>)}</Popup>
    </Marker>;
  });
}
