import {alertIntersectsRoute,eligibleTrips} from './pushMatching.js';

export async function deliverAlerts({store,alerts,send,now=new Date()}){
  if(store.expireDevices)await store.expireDevices(new Date(now.getTime()-90*86400000).toISOString());
  if(store.expireDeliveries)await store.expireDeliveries(new Date(now.getTime()-30*86400000).toISOString());
  const devices=await store.listDevices();
  let sent=0,failed=0;
  for(const device of devices){
    for(const route of device.routes || []){
      if(!route.enabled)continue;
      for(const trip of eligibleTrips(route,now))for(const alert of alerts.alerts || []){
        if(!alertIntersectsRoute(route.geometry,alert))continue;
        const key=`${route.id}:${trip}:${alert.id}`;
        if(!await store.claim(device.id,key))continue;
        try {
          await send(device.subscription,{title:'Aviso meteorológico na região da rota',body:`${route.name}: ${alert.headline}. Consulte os detalhes no aplicativo.`,url:`/?alert=${encodeURIComponent(alert.id)}`});
          sent++;
        } catch(error) {
          failed++;
          await store.release(device.id,key);
          if([404,410].includes(error.statusCode))await store.removeDevice(device.id);
        }
      }
    }
  }
  return {sent,failed};
}
