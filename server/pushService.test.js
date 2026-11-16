import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveDevice,deleteDevice} from './pushService.js';

const id='b598ea2f-0c10-45d5-9c55-854f572dc52f',token='a'.repeat(43);
const input={id,token,subscription:{endpoint:'https://fcm.googleapis.com/fcm/send/id',keys:{p256dh:'b'.repeat(87),auth:'c'.repeat(22)}},routes:[]};
test('credencial de outro dispositivo não altera nem apaga a inscrição',async()=>{
  let row;const store={getDevice:async()=>row,createDevice:async value=>{row=value;},updateDevice:async(_id,_hash,value)=>{row={...row,...value};return [{id}];},deleteDevice:async()=>{row=null;}};
  assert.equal(await saveDevice(store,input),true);
  assert.equal(await saveDevice(store,{...input,token:'z'.repeat(43)}),false);
  assert.equal(await deleteDevice(store,{id,token:'z'.repeat(43)}),false);
  assert.ok(row);
  assert.equal(await deleteDevice(store,{id,token}),true);
  assert.equal(row,null);
});

test('recusa inscrição sem geometria válida ou destino de push confiável',async()=>{
  const store={getDevice:async()=>{throw Error('não deve acessar o banco');}};
  assert.equal(await saveDevice(store,{...input,subscription:{...input.subscription,endpoint:'https://localhost/internal'}}),false);
  assert.equal(await saveDevice(store,{...input,routes:[{id:'1',name:'Rota',enabled:true,days:'Todos os dias',outbound:'08:00',returnTime:'18:00',lead:30}]}),false);
});
