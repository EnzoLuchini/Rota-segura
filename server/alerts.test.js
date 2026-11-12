import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAlertsProvider} from './alerts.js';

const now=Date.parse('2026-11-11T18:00:00Z');
const city={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.8,-23.7],[-46.5,-23.7],[-46.5,-23.4],[-46.8,-23.4],[-46.8,-23.7]]]}};
const polygon='-23.6,-46.7 -23.6,-46.6 -23.5,-46.6 -23.5,-46.7 -23.6,-46.7';
const outside='-22.6,-45.7 -22.6,-45.6 -22.5,-45.6 -22.5,-45.7 -22.6,-45.7';
const cap=({id='a',type='Alert',start='2026-11-11T14:00:00-03:00',end='2026-11-11T20:00:00-03:00',shape=polygon,refs='',status='Actual'}={})=>`<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>${id}</identifier><sender>info.aviso@inmet.gov.br</sender><sent>2026-11-11T12:00:00-03:00</sent><status>${status}</status><msgType>${type}</msgType><scope>Public</scope>${refs?`<references>${refs}</references>`:''}<info><language>pt-BR</language><event>Tempestade</event><severity>Moderate</severity><onset>${start}</onset><expires>${end}</expires><headline>Chuva intensa</headline><description>Fique atento</description><area><areaDesc>São Paulo</areaDesc><polygon>${shape}</polygon></area></info></alert>`;
const rss=ids=>`<rss version="2.0"><channel><title>Avisos</title>${ids.map(id=>`<item><link>https://apiprevmet3.inmet.gov.br/avisos/rss/${id}</link></item>`).join('')}</channel></rss>`;
function provider(docs,{body=rss(Object.keys(docs)),fail=[]}={}){
  return createAlertsProvider({now:()=>now,cityBoundary:async()=>city,fetch:async url=>{
    if(url.endsWith('/avisos/rss'))return new Response(body);
    const id=url.split('/').at(-1);if(fail.includes(id))throw Error('offline');
    return new Response(docs[id] ?? '',{status:docs[id] ? 200:404});
  }});
}

test('retorna apenas avisos vigentes que intersectam o município',async()=>{
  const data=await provider({'1':cap(), '2':cap({id:'futuro',start:'2026-11-12T14:00:00-03:00',end:'2026-11-12T20:00:00-03:00'}),'3':cap({id:'fora',shape:outside}),'4':cap({id:'expirado',start:'2026-11-11T12:00:00-03:00',end:'2026-11-11T14:00:00-03:00'})})();
  assert.equal(data.status,'available');assert.equal(data.coverage,'unknown');
  assert.deepEqual(data.alerts.map(x=>x.id),['a']);
  assert.equal(data.alerts[0].event,'Tempestade');
  assert.match(data.alerts[0].url,/^https:\/\/avisos\.inmet\.gov\.br\/1$/);
});

test('atualização substitui aviso anterior e cancelamento remove o aviso',async()=>{
  const ref='info.aviso@inmet.gov.br,a,2026-11-11T12:00:00-03:00';
  const updated=await provider({'1':cap(),'2':cap({id:'b',type:'Update',refs:ref})})();
  assert.deepEqual(updated.alerts.map(x=>x.id),['b']);
  const cancelled=await provider({'1':cap(),'2':cap({id:'c',type:'Cancel',refs:ref})})();
  assert.deepEqual(cancelled.alerts,[]);
});

test('item inválido, referência desconhecida e falha de detalhe são parciais',async()=>{
  const data=await provider({'1':cap(),'2':cap({id:'b',type:'Update',refs:'info.aviso@inmet.gov.br,desconhecido,2026-11-11T12:00:00-03:00'}),'3':'<alert>incompleto</alert>','4':cap({id:'offline'})},{fail:['4']})();
  assert.equal(data.status,'partial');assert.deepEqual(data.alerts.map(x=>x.id),['a','b']);
});

test('rejeita XML com entidades externas e feed com URL não confiável sem consultá-la',async()=>{
  let called=false;
  const unsafe='<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///test">]><rss><channel><title>&x;</title></channel></rss>';
  await assert.rejects(provider({}, {body:unsafe})());
  const data=await createAlertsProvider({now:()=>now,cityBoundary:async()=>city,fetch:async url=>{if(url.endsWith('/avisos/rss'))return new Response('<rss><channel><item><link>https://evil.example/1</link></item></channel></rss>');called=true;throw Error();}})();
  assert.equal(called,false);assert.equal(data.status,'partial');
});

test('reutiliza consulta em andamento e nunca mantém aviso expirado como vigente',async()=>{
  let clock=now,calls=0,release;
  const inmet=createAlertsProvider({now:()=>clock,cityBoundary:async()=>city,fetch:async url=>{calls++;if(url.endsWith('/avisos/rss')){await new Promise(resolve=>{release=resolve;});return new Response(rss(['1']));}return new Response(cap({end:'2026-11-11T15:01:00-03:00'}));}});
  const a=inmet(),b=inmet();
  await Promise.resolve();assert.equal(calls,1);release();
  const [first,second]=await Promise.all([a,b]);assert.equal(first.alerts.length,1);assert.equal(second.alerts.length,1);assert.equal(calls,2);
  clock+=61000;assert.equal((await inmet()).alerts.length,0);assert.equal(calls,2);
});

test('falha de todos os documentos não é interpretada como nenhum aviso',async()=>{
  await assert.rejects(provider({'1':cap()},{fail:['1']})());
});

test('data inexistente em aviso não é interpretada como data válida',async()=>{
  const data=await provider({'1':cap(),'2':cap({id:'inválido',start:'2026-02-30T14:00:00-03:00'})})();
  assert.equal(data.status,'partial');
  assert.deepEqual(data.alerts.map(a=>a.id),['a']);
});

test('limita o tempo total e preserva somente documentos já verificados',async()=>{
  const inmet=createAlertsProvider({now:()=>now,deadlineMs:30,cityBoundary:async()=>city,fetch:async (url,options)=>{
    if(url.endsWith('/avisos/rss'))return new Response(rss(['1','2']));
    if(url.endsWith('/1'))return new Response(cap());
    return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout')),{once:true}));
  }});
  const started=Date.now();const result=await inmet();
  assert.ok(Date.now()-started<1000,'deve respeitar o prazo total');
  assert.equal(result.status,'partial');assert.deepEqual(result.alerts.map(a=>a.id),['a']);
});
