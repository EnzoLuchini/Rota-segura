import React,{useEffect,useRef,useState} from 'react';
import {CircleMarker,Popup,useMap} from 'react-leaflet';

export default function MapLocation({request,onStatus}) {
  const map=useMap(),[position,setPosition]=useState(null),latest=useRef(0);
  useEffect(()=>{
    if(!request)return;
    const id=++latest.current;let successTimer;
    if(!navigator.geolocation){onStatus('Localização indisponível neste navegador.');return;}
    onStatus('Buscando sua localização…');
    navigator.geolocation.getCurrentPosition(result=>{
      if(id!==latest.current)return;
      const point=[result.coords.latitude,result.coords.longitude];
      setPosition(point);map.setView(point,16);onStatus('Localização encontrada no mapa.');successTimer=setTimeout(()=>{if(id===latest.current)onStatus('');},4000);
    },error=>{
      if(id!==latest.current)return;
      onStatus(error.code===1?'Permissão de localização negada. Verifique as permissões do navegador.':'Não foi possível obter sua localização. Tente novamente.');
    },{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
    return()=>{latest.current++;clearTimeout(successTimer);};
  },[request,map,onStatus]);
  return position?<CircleMarker center={position} radius={9} pathOptions={{color:'white',weight:3,fillColor:'#1763e9',fillOpacity:1}}><Popup>Sua localização aproximada</Popup></CircleMarker>:null;
}
