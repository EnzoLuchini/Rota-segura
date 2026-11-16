import {expect,it} from 'vitest';
import {routeAlertMatch,routeAlertSummary} from './routeAlertMatching';

it('não interpreta geometrias inválidas como ausência de avisos',()=>{
  const route={geometry:{type:'LineString',coordinates:[[-46.7,-23.5],['inválido',-23.5]]}};
  expect(routeAlertSummary(route,[]).status).toBe('unknown');
  expect(routeAlertMatch({type:'LineString',coordinates:[[-46.7,-23.5],[-46.6,-23.5]]},{areas:[]})).toBeNull();
});

it('distingue avisos intersectados de geometria que não pôde ser avaliada',()=>{
  const geometry={type:'LineString',coordinates:[[-46.7,-23.56],[-46.65,-23.56]]};
  const polygon={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.72,-23.58],[-46.64,-23.58],[-46.64,-23.54],[-46.72,-23.54],[-46.72,-23.58]]]}};
  const valid={id:'1',areas:[polygon]},unknown={id:'2',areas:[]};
  const summary=routeAlertSummary({geometry},[valid,unknown]);
  expect(summary.status).toBe('unknown');expect(summary.matches).toEqual([valid]);
});
