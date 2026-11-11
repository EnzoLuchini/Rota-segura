import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {floodAreasAlongRoute} from './providers.js';

test('consulta manchas pela geometria exata em lotes e preserva truncamento',async()=>{
  const calls=[];
  const fake=mock.method(globalThis,'fetch',async url=>{calls.push(new URL(url));return {ok:true,json:async()=>({type:'FeatureCollection',features:[],totalFeatures:0})};});
  try {
    const points=Array.from({length:81},(_,i)=>[-46.7+i*.0001,-23.5]);
    const data=await floodAreasAlongRoute(points,25);
    assert.equal(calls.length,2);
    assert.match(calls[0].searchParams.get('CQL_FILTER'),/^INTERSECTS\(ge_poligono,SRID=4326;LINESTRING\(/);
    assert.equal(data.truncated,false);
  } finally {fake.mock.restore();}
});
