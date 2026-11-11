import React, {useEffect,useState} from 'react';
import L from 'leaflet';
import {Marker,Popup} from 'react-leaflet';

const rainIcon=L.divIcon({className:'rain-marker',html:'<span aria-hidden="true">☔</span>',iconSize:[30,30],iconAnchor:[15,15]});
const formatDate=value=>new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(value));

export default function RainLayer({enabled}) {
  const [stations,setStations]=useState([]),[status,setStatus]=useState('');
  useEffect(()=>{
    if(!enabled){setStations([]);setStatus('');return;}
    let active=true,controller;
    async function load(){
      controller=new AbortController();
      setStatus('Carregando chuva observada…');
      try {
        const response=await fetch('/api/rain',{signal:controller.signal});
        if(!response.ok)throw new Error('indisponível');
        const data=await response.json();
        if(!Array.isArray(data.stations))throw new Error('resposta inválida');
        if(!active)return;
        setStations(data.stations);
        setStatus(data.stations.length ? (data.partial ? 'Medições parciais: alguns registros não puderam ser usados; a cobertura é limitada.' : 'Medições por estação; a cobertura é limitada.') : 'Nenhuma medição válida disponível nas estações consultadas.');
      } catch(error){if(active && error.name!=='AbortError'){setStations([]);setStatus('Chuva observada indisponível no momento.');}}
    }
    load();
    const timer=setInterval(load,60000);
    return ()=>{active=false;clearInterval(timer);controller?.abort();};
  },[enabled]);
  useEffect(()=>{const node=document.getElementById('rain-status');if(node)node.textContent=status;},[status]);
  if(!enabled)return null;
  return <>{stations.map(station=><Marker key={station.id} position={[station.coordinates[1],station.coordinates[0]]} icon={rainIcon} title={`Estação de chuva: ${station.name}`} alt={`Estação de chuva: ${station.name}`}><Popup><div className="rain-popup"><strong>{station.name}</strong><p>{station.value.toLocaleString('pt-BR')} mm de chuva no período consultado</p><p>De {formatDate(station.start)} até {formatDate(station.end)} (horário de Brasília).</p>{station.stale && <p><strong>Medição antiga.</strong></p>}<p>Fonte: SIBH / SP Águas{station.owner ? ` · ${station.owner}` : ''}. A medição representa apenas a estação e não indica alagamento na via.</p></div></Popup></Marker>)}</>;
}
