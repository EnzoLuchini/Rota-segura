import {useCallback,useEffect,useRef,useState} from 'react';

const STORAGE_KEY='rota-segura-push-device-v1';
const bytesToBase64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decodeKey=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));
const credential=()=>({id:crypto.randomUUID(),token:bytesToBase64(crypto.getRandomValues(new Uint8Array(32)))});

export function usePushNotifications(routes,enabled=true){
  const [status,setStatus]=useState('off'),[message,setMessage]=useState('');
  const [config,setConfig]=useState(null);
  const [retryCount,setRetryCount]=useState(0);
  const serial=useRef(Promise.resolve());
  const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');}catch{return null;}};
  useEffect(()=>{if(!enabled)return;let active=true;fetch('/api/push/config').then(response=>response.json()).then(value=>{if(active)setConfig(value);}).catch(()=>{if(active)setConfig({available:false});});return()=>{active=false;};},[enabled]);
  const sync=useCallback(async (device,subscription,currentRoutes)=>{
    const monitored=currentRoutes.filter(route=>route.pushEnabled && route.geometry).map(route=>({id:route.id,name:route.name,geometry:route.geometry,enabled:true,days:route.days,outbound:route.outbound,returnTime:route.returnTime,lead:Number(route.lead || 30)}));
    const response=await fetch('/api/push/device',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...device,subscription:subscription.toJSON(),routes:monitored})});
    if(!response.ok)throw Error('Não foi possível sincronizar os alertas. Tente novamente.');
  },[]);
  useEffect(()=>{
    if(!enabled)return;
    const device=read();if(!device)return;
    let active=true;
    serial.current=serial.current.catch(()=>{}).then(async()=>{
      setStatus('syncing');
      const registration=await navigator.serviceWorker?.getRegistration('/');
      const subscription=await registration?.pushManager?.getSubscription();
      if(!subscription || Notification.permission!=='granted')throw Error('A permissão ou inscrição de notificações não está ativa.');
      await sync(device,subscription,routes);
      if(active){setStatus('active');setMessage('');}
    }).catch(error=>{if(active){setStatus('error');setMessage(error.message || 'Não foi possível sincronizar os alertas.');}});
    return()=>{active=false;};
  },[routes,sync,enabled,retryCount]);
  const activate=async()=>{
    try {
      setStatus('syncing');setMessage('');
      if(!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))throw Error('Notificações não disponíveis neste navegador. No iPhone, adicione o site à Tela de Início e abra pelo ícone.');
      if(!config?.available || !config.publicKey)throw Error('Notificações ainda não estão configuradas no servidor.');
      const permission=await Notification.requestPermission();
      if(permission!=='granted')throw Error('Permissão para notificações não concedida.');
      const registration=await navigator.serviceWorker.register('/push-sw.js');
      let subscription=await registration.pushManager.getSubscription();
      if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(config.publicKey)});
      const device=read() || credential();localStorage.setItem(STORAGE_KEY,JSON.stringify(device));
      await sync(device,subscription,routes);setStatus('active');
      return true;
    } catch(error){setStatus('error');setMessage(error.message || 'Não foi possível ativar as notificações.');return false;}
  };
  const disable=async()=>{
    try {
      setStatus('syncing');await serial.current.catch(()=>{});const device=read();
      if(device){const response=await fetch('/api/push/device',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify(device)});if(!response.ok)throw Error('Não foi possível remover os dados de alertas no servidor.');}
      const registration=await navigator.serviceWorker?.getRegistration('/');const subscription=await registration?.pushManager?.getSubscription();
      await subscription?.unsubscribe();localStorage.removeItem(STORAGE_KEY);setStatus('off');setMessage('');return true;
    }catch(error){setStatus('error');setMessage(error.message || 'Não foi possível desativar as notificações.');return false;}
  };
  return {status,message,registered:Boolean(read()),activate,disable,retry:()=>setRetryCount(value=>value+1)};
}
