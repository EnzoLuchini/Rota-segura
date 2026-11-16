import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deliverAlerts} from './pushWorker.js';

const area={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.7,-23.6],[-46.6,-23.6],[-46.6,-23.5],[-46.7,-23.5],[-46.7,-23.6]]]}};
const device={id:'one',subscription:{endpoint:'https://example.test'},routes:[{id:'route',name:'Casa',enabled:true,days:'Segunda a sexta',outbound:'08:00',returnTime:'18:00',lead:30,geometry:{type:'LineString',coordinates:[[-46.8,-23.55],[-46.65,-23.55]]}}]};
test('envia apenas uma vez por aviso e janela de viagem',async()=>{
  const claimed=new Set(),messages=[];
  const store={listDevices:async()=>[device],claim:async(_id,key)=>{if(claimed.has(key))return false;claimed.add(key);return true;},release:async(_id,key)=>claimed.delete(key)};
  const alerts={alerts:[{id:'alerta',headline:'Chuva intensa',end:'2026-11-17T12:00:00Z',areas:[area]}]};
  const options={store,alerts,now:new Date('2026-11-16T10:45:00Z'),send:async(_sub,payload)=>messages.push(payload)};
  await deliverAlerts(options);await deliverAlerts(options);
  assert.equal(messages.length,1);
  assert.match(messages[0].body,/Casa/);
});

test('não envia para rota pausada e permite nova tentativa após falha temporária',async()=>{
  const claimed=new Set(),messages=[];let fails=true;
  const store={listDevices:async()=>[{...device,routes:[{...device.routes[0],enabled:false},device.routes[0]]}],claim:async(_id,key)=>{if(claimed.has(key))return false;claimed.add(key);return true;},release:async(_id,key)=>claimed.delete(key)};
  const alerts={alerts:[{id:'alerta',headline:'Chuva intensa',areas:[area]}]};
  const send=async(_subscription,payload)=>{if(fails){fails=false;throw Error('offline');}messages.push(payload);};
  const options={store,alerts,send,now:new Date('2026-11-16T10:45:00Z')};
  assert.equal((await deliverAlerts(options)).failed,1);
  assert.equal((await deliverAlerts(options)).sent,1);
  assert.equal(messages.length,1);
});

test('não envia aviso cuja área não cruza a rota',async()=>{
  let sent=false;
  const store={listDevices:async()=>[device],claim:async()=>{throw Error('não deve reservar envio');}};
  await deliverAlerts({store,alerts:{alerts:[{id:'fora',areas:[]}]},now:new Date('2026-11-16T10:45:00Z'),send:async()=>{sent=true;}});
  assert.equal(sent,false);
});
