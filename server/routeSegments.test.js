import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildRouteSegments} from '../src/data/realRouteSegments.js';

test('divide rota e associa amostras e ocorrências sem fundir tipos com mesmo ID',()=>{
 const route={geometry:{type:'LineString',coordinates:[[-46.65,-23.55],[-46.64,-23.55]]},rain:{samples:[{distanceKm:0,stationId:'a',stationDistanceMeters:5},{distanceKm:0.75,stationId:null,stationDistanceMeters:null}],stations:[{id:'a',name:'A',value:3}]},floodContext:{history:{status:'available',events:[{id:'1',kind:'alagamento',coordinates:[-46.6499,-23.55]},{id:'1',kind:'inundacao',coordinates:[-46.6499,-23.55]}]},areas:{5:{status:'available',segmentIndexes:[0]}}}};
 const segments=buildRouteSegments(route,[]);
 assert.equal(segments.length,3);
 assert.equal(segments[0].events.length,2);
 assert.equal(segments[0].samples[0].stationId,'a');
 assert.equal(segments[1].samples[0].stationId,null);
 assert.equal(segments[0].riskCrossing,false);
 assert.equal(segments[0].geometry.type,'LineString');
});
