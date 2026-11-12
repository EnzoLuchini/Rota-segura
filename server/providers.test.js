import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {floodAreasAlongRoute,drivingRoutes} from './providers.js';

test('rejeita rotas do provedor sem geometria, duração ou distância válidas',async()=>{
  const valid={type:'Feature',geometry:{type:'LineString',coordinates:[[-46.7,-23.5],[-46.69,-23.5]]},properties:{summary:{distance:1000,duration:100}}};
  let features=[valid];
  const fake=mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({features})}));
  try{
    assert.deepEqual(await drivingRoutes([-46.7,-23.5],[-46.69,-23.5],'test'),[valid]);
    for (const invalid of [
      {...valid,geometry:{type:'LineString',coordinates:[[-46.7,-23.5]]}},
      {...valid,geometry:{type:'LineString',coordinates:[[-46.7,-23.5],['-46.69',-23.5]]}},
      {...valid,properties:{}},
      {...valid,properties:{summary:{distance:1000,duration:-1}}},
      {...valid,properties:{summary:{distance:null,duration:100}}},
    ]){
      features=[invalid];
      await assert.rejects(drivingRoutes([-46.7,-23.5],[-46.69,-23.5],'test'));
    }
  }finally{fake.mock.restore();}
});

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
