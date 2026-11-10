import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeRoutes, routeWithinCity} from './analysis.js';

const polygon = (x1,y1,x2,y2) => ({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[x1,y1],[x2,y1],[x2,y2],[x1,y2],[x1,y1]]]}});
const route = (coordinates) => ({type:'Feature',properties:{},geometry:{type:'LineString',coordinates}});
test('trajeto que sai e volta aos limites é rejeitado', () => {
  assert.equal(routeWithinCity(route([[0.2,0.2],[1.5,0.5],[0.8,0.8]]), polygon(0,0,1,1)), false);
});
test('trajeto inteiramente fora dos limites é rejeitado', () => {
  assert.equal(routeWithinCity(route([[2,2],[3,3]]), polygon(0,0,1,1)), false);
});
test('trajeto inteiramente dentro da área é contabilizado', () => {
  const results = analyzeRoutes([route([[0.2,0.5],[0.8,0.5]])], [polygon(0,0,1,1)]);
  assert.ok(results[0].exposureMeters > 60000);
});
test('sobreposição de polígonos não duplica extensão exposta', () => {
  const results = analyzeRoutes([route([[0,0.5],[2,0.5]])], [polygon(0,0,1.5,1),polygon(0.5,0,2,1)]);
  assert.ok(results[0].exposureMeters < 224000 && results[0].exposureMeters > 220000);
});
test('sem fonte disponível não existe recomendação nem exposição zero', () => {
  const results = analyzeRoutes([route([[0,0],[1,1]])], null);
  assert.equal(results[0].exposureMeters, null);
});
test('áreas intersectadas preservam identificação e data da vistoria', () => {
  const area = polygon(0,0,1,1);
  area.properties = {nm_area_risco_hidrologico:'Teste',dt_vistoria:'2021-01-01Z'};
  const [result] = analyzeRoutes([route([[-1,0.5],[2,0.5]])], [area]);
  assert.deepEqual(result.evidence.map(e => [e.name,e.date]), [['Teste','2021-01-01Z']]);
});
