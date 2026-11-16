import {createHash,timingSafeEqual} from 'node:crypto';
import {validSubscription} from './pushValidation.js';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern=/^[A-Za-z0-9_-]{43}$/;
const hash=token=>createHash('sha256').update(token).digest('hex');
const same=(a,b)=>typeof a==='string' && a.length===b.length && timingSafeEqual(Buffer.from(a),Buffer.from(b));
const time=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
function validRoute(route){
  const points=route?.geometry?.coordinates;
  return typeof route?.id==='string' && route.id.length<=100 && typeof route.name==='string' && route.name.length>0 && route.name.length<=100 && typeof route.enabled==='boolean' && ['Segunda a sexta','Todos os dias','Fins de semana'].includes(route.days) && time(route.outbound) && time(route.returnTime) && [15,30,60].includes(Number(route.lead)) && route.geometry?.type==='LineString' && Array.isArray(points) && points.length>=2 && points.length<=10000 && points.every(p=>Array.isArray(p) && p.length===2 && p.every(Number.isFinite) && p[0]>=-47 && p[0]<=-46 && p[1]>=-24.2 && p[1]<=-23.2);
}
export async function saveDevice(store,input){
  if(!uuid.test(input?.id || '') || !tokenPattern.test(input?.token || '') || !validSubscription(input?.subscription) || !Array.isArray(input.routes) || input.routes.length>30 || !input.routes.every(validRoute))return false;
  const tokenHash=hash(input.token),existing=await store.getDevice(input.id);
  if(existing && !same(existing.token_hash,tokenHash))return false;
  const payload={subscription:input.subscription,routes:input.routes,updated_at:new Date().toISOString()};
  if(existing){const result=await store.updateDevice(input.id,tokenHash,payload);return result.length===1;}
  await store.createDevice({id:input.id,token_hash:tokenHash,...payload});return true;
}
export async function deleteDevice(store,input){
  if(!uuid.test(input?.id || '') || !tokenPattern.test(input?.token || ''))return false;
  const tokenHash=hash(input.token),existing=await store.getDevice(input.id);
  if(existing && !same(existing.token_hash,tokenHash))return false;
  if(existing)await store.deleteDevice(input.id,tokenHash);
  return true;
}
