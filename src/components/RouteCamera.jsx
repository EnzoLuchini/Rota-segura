import React,{useEffect,useRef} from 'react';
import {CircleMarker,Popup,useMap} from 'react-leaflet';

function panelOffset(map){
  if(!window.matchMedia?.('(max-width: 800px)').matches)return 0;
  const panel=document.querySelector('.workspace:not(.page-view) > .panel');
  const height=panel?.getBoundingClientRect().height || 0;
  return Math.max(0,Math.min(height,(map.getSize?.().y || height+80)-80));
}

function visibleCenter(map,point,zoom){
  const offset=panelOffset(map);
  if(!offset || !map.project || !map.unproject)return point;
  const projected=map.project(point,zoom);
  return map.unproject(projected.add([0,offset/2]),zoom);
}

export function RouteCamera({view,routes,selected,position}){
  const map=useMap(),following=useRef(false);
  useEffect(()=>{
    if(view!=='compare')return;
    const coordinates=routes[selected]?.geometry?.coordinates;
    if(!Array.isArray(coordinates) || coordinates.length<2)return;
    const points=coordinates.map(([lon,lat])=>[lat,lon]);
    map.invalidateSize({animate:false,pan:false});
    map.flyToBounds?.(points,{paddingTopLeft:[35,35],paddingBottomRight:[35,35+panelOffset(map)],maxZoom:16,duration:1,animate:true});
  },[map,view,routes,selected]);
  useEffect(()=>{
    if(view!=='navigate'){following.current=false;return;}
    if(!position)return;
    const point=[position.latitude,position.longitude];
    if(!following.current){following.current=true;map.flyTo?.(visibleCenter(map,point,16),16,{duration:1.2,animate:true});}
    else map.panTo?.(visibleCenter(map,point,map.getZoom()),{duration:0.6,animate:true});
  },[map,view,position]);
  return view==='navigate' && position?<CircleMarker center={[position.latitude,position.longitude]} radius={9} pathOptions={{color:'white',weight:3,fillColor:'#1763e9',fillOpacity:1}}><Popup>Sua localização aproximada</Popup></CircleMarker>:null;
}
