import {useCallback,useEffect,useRef,useState} from 'react';
export function useRouteTracking(){
  const [active,setActive]=useState(false),[position,setPosition]=useState(null),[error,setError]=useState('');
  const watch=useRef(null),generation=useRef(0);
  const stop=useCallback(()=>{generation.current++;if(watch.current!==null)navigator.geolocation?.clearWatch(watch.current);watch.current=null;setActive(false);setPosition(null);setError('');},[]);
  useEffect(()=>()=>{generation.current++;if(watch.current!==null)navigator.geolocation?.clearWatch(watch.current);},[]);
  const start=useCallback(()=>{
    if(watch.current!==null)return;
    setError('');
    if(!navigator.geolocation?.watchPosition){setError('Localização indisponível neste navegador.');return;}
    const id=++generation.current;setActive(true);
    watch.current=navigator.geolocation.watchPosition(({coords})=>{
      if(id!==generation.current)return;
      if(Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude))setPosition({latitude:coords.latitude,longitude:coords.longitude,accuracy:coords.accuracy});
      setError('');
    },problem=>{if(id===generation.current){setPosition(null);setError(problem.code===1?'Permissão de localização negada. Verifique os ajustes do navegador.':problem.code===3?'Localização demorou para responder. Aguardando sinal…':'Localização indisponível. Aguardando sinal…');}},{enableHighAccuracy:true,timeout:15000,maximumAge:5000});
  },[]);
  return {active,position,error,start,stop};
}
