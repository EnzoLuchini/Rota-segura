import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visibleHistory} from '../src/data/citySnapshot.js';

test('filtra somente pontos no mapa e preserva fontes com mesmo ID',()=>{
 const f=(id,kind,coordinates)=>({id,kind,geometry:{type:'Point',coordinates}});
 const events=[f('1','alagamento',[-46.6,-23.5]),f('1','inundacao',[-46.6,-23.5]),f('2','alagamento',[-46.8,-23.5]),f('3','alagamento',null)];
 assert.deepEqual(visibleHistory(events,[-46.7,-23.6,-46.5,-23.4]).map(x=>x.kind),['alagamento','inundacao']);
});
