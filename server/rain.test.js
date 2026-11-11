import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRainProvider} from './rain.js';

const now = Date.parse('2026-11-11T18:30:00Z');
const station = {station_prefix_id:'136',station_name:'São Paulo (Rio Cipó)',cod_ibge:'3550308',latitude:'-23.89',longitude:'-46.80',station_owner:'SABESP',value:0,min_date:'2026-11-11T17:20:00Z',max_date:'2026-11-11T18:00:00Z'};

test('consultas simultâneas compartilham a mesma requisição e falhas permitem nova tentativa', async () => {
  let calls=0,release;
  const provider=createRainProvider({now:()=>now,fetch:async()=>{calls++;await new Promise(resolve=>{release=resolve;});if(calls===1)throw Error('falha');return {ok:true,json:async()=>({measurements:[station]})};}});
  const first=provider(),second=provider();
  assert.equal(calls,1);
  release();
  assert.deepEqual((await Promise.allSettled([first,second])).map(x=>x.status),['rejected','rejected']);
  const third=provider();
  assert.equal(calls,2);
  release();
  assert.equal((await third).stations.length,1);
});

test('normaliza medições válidas, preserva zero e sinaliza observações antigas', async () => {
  const provider=createRainProvider({now:()=>now,fetch:async()=>({ok:true,json:async()=>({measurements:[station,{...station,station_prefix_id:'2',min_date:'2026-11-11T14:20:00Z',max_date:'2026-11-11T15:00:00Z'},{...station,cod_ibge:'123'}, {...station,value:null}, {...station,longitude:''}, {...station,max_date:'inválido'}, {...station,station_name:'Precipitação Radar Bacia'}]})})});
  const result=await provider();
  assert.equal(result.stations.length,2);
  assert.equal(result.stations[0].value,0);
  assert.deepEqual(result.stations[0].coordinates,[-46.8,-23.89]);
  assert.equal(result.stations[0].stale,false);
  assert.equal(result.stations[1].stale,true);
  assert.equal(result.partial,true);
});

test('reutiliza resultados por um minuto e não mantém falhas em cache', async () => {
  let calls=0,time=now;
  const provider=createRainProvider({now:()=>time,fetch:async()=>{calls++;if(calls===2)throw Error('indisponível');return {ok:true,json:async()=>({measurements:[station]})};}});
  await provider(); await provider(); assert.equal(calls,1);
  time+=60001; await assert.rejects(provider()); await provider(); assert.equal(calls,3);
});

test('resposta inválida não é interpretada como ausência de chuva', async () => {
  const provider=createRainProvider({fetch:async()=>({ok:true,json:async()=>({})})});
  await assert.rejects(provider());
});

test('não aceita datas sem fuso explícito ou datas inexistentes', async () => {
  const provider=createRainProvider({now:()=>now,fetch:async()=>({ok:true,json:async()=>({measurements:[
    {...station,max_date:'2026-11-11T18:00:00'},
    {...station,min_date:'2026-02-30T17:20:00Z'},
    station,
  ]})})});
  const result=await provider();
  assert.equal(result.stations.length,1);
  assert.equal(result.partial,true);
});
