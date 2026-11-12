import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeFloodContext} from './floodContext.js';

const route = {type:'Feature',geometry:{type:'LineString',coordinates:[[-46.7,-23.5],[-46.69,-23.5],[-46.68,-23.5]]},properties:{}};
const point = (id,coordinates) => ({type:'Feature',id,geometry:{type:'Point',coordinates},properties:{dt_ocorrencia:'2026-01-01Z',dc_tipo_ocorrencia:'INUNDACAO'}});
const area = {type:'Feature',id:'a',geometry:{type:'Polygon',coordinates:[[[-46.696,-23.501],[-46.694,-23.501],[-46.694,-23.499],[-46.696,-23.499],[-46.696,-23.501]]]},properties:{qt_tempo_retorno:25}};

test('relaciona somente pontos próximos e trechos que cruzam manchas',()=>{
  const result=analyzeFloodContext(route,{history:{features:[point('near',[-46.695,-23.5001]),point('far',[-46.695,-23.51])],truncated:false},areas:{25:{features:[area],truncated:false}}});
  assert.equal(result.history.events.length,1);
  assert.equal(result.history.events[0].id,'near');
  assert.equal(result.history.events[0].segmentIndex,0);
  assert.deepEqual(result.areas[25].segmentIndexes,[0]);
});

test('fontes parciais ou indisponíveis não produzem contagens completas',()=>{
  const result=analyzeFloodContext(route,{history:{features:[],truncated:true},areas:{25:null}});
  assert.equal(result.history.status,'partial');
  assert.equal(result.areas[25].status,'unavailable');
});

test('registro junto ao destino pertence ao último trecho existente',()=>{
  const result=analyzeFloodContext(route,{history:{features:[point('end',[-46.68,-23.5])],truncated:false},areas:{}});
  assert.equal(result.history.events[0].segmentIndex,1);
});

test('preserva a camada de origem do registro histórico associado',()=>{
  const result=analyzeFloodContext(route,{history:{features:[{...point('same',[-46.695,-23.5]),kind:'alagamento'},{...point('same',[-46.695,-23.5]),kind:'inundacao'}],truncated:false},areas:{}});
  assert.deepEqual(result.history.events.map(event=>event.kind),['alagamento','inundacao']);
});
