import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rainForRoute, scoreRoutes, distinctHistory} from './routeScoring.js';

const now=Date.parse('2026-11-12T15:00:00Z');
const route={type:'Feature',geometry:{type:'LineString',coordinates:[[-46.65,-23.55],[-46.64,-23.55]]}};
const station=(id,lon,value,end='2026-11-12T14:40:00Z')=>({id,name:id,coordinates:[lon,-23.55],value,start:'2026-11-12T14:00:00Z',end,owner:'SIBH'});

test('associa estações válidas próximas ao longo do trajeto e mantém o máximo e a validade',()=>{
  const r=rainForRoute(route,{stations:[station('a',-46.65,3),station('b',-46.64,12)],partial:false,queriedAt:'2026-11-12T15:00:00Z'},now);
  assert.equal(r.status,'available'); assert.equal(r.maxMm,12);
  assert.deepEqual(r.stations.map(x=>x.id).sort(),['a','b']);
  assert.equal(r.validUntil,'2026-11-12T15:01:00.000Z');
  assert.ok(r.stations.every(s=>Number.isFinite(s.maxDistanceMeters)));
});

test('não trata estação distante ou antiga como cobertura nem chuva zero',()=>{
  for(const stations of [[station('a',-46.8,0)],[station('a',-46.65,0,'2026-11-12T13:29:59Z')],[]]){
    const r=rainForRoute(route,{stations,partial:false,queriedAt:'2026-11-12T15:00:00Z'},now);
    assert.equal(r.status,'unavailable');assert.equal(r.maxMm,null);
  }
  const r=rainForRoute(route,{stations:[station('a',-46.65,0)],partial:true,queriedAt:'2026-11-12T15:00:00Z'},now);
  assert.equal(r.status,'partial');
});

test('deduplica por tipo e identificador sem juntar ocorrências de fontes distintas',()=>{
 const e=(id,kind)=>({id,kind,geometry:{type:'Point',coordinates:[-46.65,-23.55]}});
 const d=distinctHistory([e('1','alagamento'),e('1','alagamento'),e('1','inundacao')]);
 assert.equal(d.features.length,2);assert.equal(d.complete,true);
 assert.equal(distinctHistory([e(undefined,'alagamento')]).complete,false);
});

test('normaliza os três indicadores e recomenda a menor pontuação única',()=>{
 const r=scoreRoutes([{exposureMeters:0,historyCount:2,rainMm:8},{exposureMeters:100,historyCount:0,rainMm:4}]);
 assert.deepEqual(r.scores,[50,50]);assert.equal(r.recommended,-1);assert.equal(r.reason,'score_tie');
 const s=scoreRoutes([{exposureMeters:0,historyCount:0,rainMm:8},{exposureMeters:100,historyCount:2,rainMm:4}]);
 assert.deepEqual(s.scores,[20,80]);assert.equal(s.recommended,0);assert.equal(s.reason,'lowest_combined_score');
 assert.equal(scoreRoutes([{exposureMeters:0,historyCount:null,rainMm:1},{exposureMeters:3,historyCount:0,rainMm:2}]).recommended,-1);
 assert.equal(scoreRoutes([{exposureMeters:0,historyCount:0,rainMm:0}]).reason,'single_route');
});


test('não usa medições futuras ou no limite de expiração',()=>{
  for(const end of ['2026-11-12T15:00:01Z','2026-11-12T13:30:00Z']) {
    const result=rainForRoute(route,{stations:[station('a',-46.65,1,end)],partial:false,queriedAt:'2026-11-12T15:00:00Z'},now);
    assert.equal(result.status,'unavailable');
  }
});

test('exige pelo menos um ponto de diferença antes de recomendar',()=>{
  const factor=x=>({exposureMeters:x,historyCount:0,rainMm:0});
  const close=scoreRoutes([factor(0),factor(1),factor(100)]);
  assert.equal(close.reason,'score_tie');assert.equal(close.recommended,-1);
  const distinct=scoreRoutes([factor(0),factor(2),factor(100)]);
  assert.equal(distinct.reason,'lowest_combined_score');assert.equal(distinct.recommended,0);
});

test('não deduplica registros distintos sem identificador utilizável',()=>{
  const result=distinctHistory([{id:'',kind:'alagamento'},{id:'  ',kind:'alagamento'}]);
  assert.equal(result.complete,false);assert.equal(result.features.length,2);
});
