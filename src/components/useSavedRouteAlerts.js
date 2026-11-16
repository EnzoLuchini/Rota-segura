import {useEffect,useState} from 'react';
import {routeAlertSummary} from './routeAlertMatching';

export function useSavedRouteAlerts(routes=[],enabled){
  const [data,setData]=useState(null),[error,setError]=useState(false),[clock,setClock]=useState(Date.now());
  useEffect(()=>{
    if(!enabled || !routes.length)return;
    let active=true,controller;
    const load=async()=>{
      controller=new AbortController();
      try{const response=await fetch('/api/alerts',{signal:controller.signal});if(!response.ok)throw Error();const value=await response.json();if(!Array.isArray(value.alerts) || !['available','partial'].includes(value.status))throw Error();if(active){setData(value);setError(false);setClock(Date.now());}}
      catch(e){if(active && e.name!=='AbortError'){setData(null);setError(true);}}
    };
    setData(null);setError(false);load();const refresh=setInterval(load,120000),tick=setInterval(()=>setClock(Date.now()),30000);
    return()=>{active=false;clearInterval(refresh);clearInterval(tick);controller?.abort();};
  },[enabled,routes.length]);
  if(!enabled || !routes.length)return {};
  const current=(data?.alerts || []).filter(alert=>Date.parse(alert.start)<=clock && clock<Date.parse(alert.end));
  return Object.fromEntries(routes.map(route=>[route.id,error?{status:'error'}:!data?{status:'loading'}:{...routeAlertSummary(route,current),partial:data.status==='partial',checkedAt:data.checkedAt}]));
}
