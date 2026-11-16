import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eligibleTrips,alertIntersectsRoute} from './pushMatching.js';

const area={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.7,-23.6],[-46.6,-23.6],[-46.6,-23.5],[-46.7,-23.5],[-46.7,-23.6]]]}};
test('verifica a geometria real da rota com os polígonos do aviso',()=>{
  assert.equal(alertIntersectsRoute({type:'LineString',coordinates:[[-46.8,-23.55],[-46.65,-23.55]]},{areas:[area]}),true);
  assert.equal(alertIntersectsRoute({type:'LineString',coordinates:[[-46.9,-23.55],[-46.8,-23.55]]},{areas:[area]}),false);
  assert.equal(alertIntersectsRoute(null,{areas:[area]}),false);
});
test('respeita dia e janela de antecedência no horário de São Paulo',()=>{
  const route={days:'Segunda a sexta',outbound:'08:00',returnTime:'18:00',lead:30};
  assert.deepEqual(eligibleTrips(route,new Date('2026-11-16T10:45:00Z')),['2026-11-16:ida']);
  assert.deepEqual(eligibleTrips(route,new Date('2026-11-16T11:01:00Z')),[]);
  assert.deepEqual(eligibleTrips(route,new Date('2026-11-15T10:45:00Z')),[]);
  assert.deepEqual(eligibleTrips({...route,outbound:'00:10'},new Date('2026-11-17T02:50:00Z')),['2026-11-17:ida']);
});
