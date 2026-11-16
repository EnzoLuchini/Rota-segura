import {along, distance, length, point} from '@turf/turf';
export {scoreRoutes} from '../src/data/scoreRoutes.js';

const MAX_AGE=90*60000, MAX_DISTANCE=3, SAMPLE_KM=0.25;

export function hasStableHistoryId(feature) {
  return (typeof feature?.id==='string' && feature.id.trim().length>0) || (typeof feature?.id==='number' && Number.isFinite(feature.id));
}

export function distinctHistory(features) {
  const seen=new Set(), output=[];
  let complete=true;
  for(const feature of features) {
    if(!hasStableHistoryId(feature) || !feature.kind) {complete=false;output.push(feature);continue;}
    const key=JSON.stringify([feature.kind,String(feature.id)]);
    if(!seen.has(key)){seen.add(key);output.push(feature);}
  }
  return {features:output,complete};
}

export function rainForRoute(route, data, now=Date.now()) {
  const queriedAt=Date.parse(data?.queriedAt), raw=Array.isArray(data?.stations)?data.stations:[];
  const valid=raw.filter(s=>{
    const start=Date.parse(s.start),end=Date.parse(s.end);
    return s.id && s.name && Array.isArray(s.coordinates) && s.coordinates.length===2 && s.coordinates.every(Number.isFinite) && Number.isFinite(s.value) && s.value>=0 && Number.isFinite(start) && Number.isFinite(end) && start<=end && end<=now && now-end<MAX_AGE && !s.stale;
  });
  if (!Number.isFinite(queriedAt) || queriedAt>now+300000 || now-queriedAt>=60000 || !valid.length) return {status:'unavailable',maxMm:null,stations:[],queriedAt:data?.queriedAt || null,validUntil:null};
  const routeLength=length(route,{units:'kilometers'}), samples=[];
  for(let km=0;km<routeLength;km+=SAMPLE_KM) samples.push({distanceKm:km,point:along(route,km,{units:'kilometers'})});
  samples.push({distanceKm:routeLength,point:along(route,routeLength,{units:'kilometers'})});
  const used=new Map(), associations=[];let uncovered=0;
  for(const sample of samples){
    let nearest=null, nearestDistance=Infinity;
    for(const station of valid){const d=distance(sample.point,point(station.coordinates),{units:'kilometers'});if(d<nearestDistance){nearest=station;nearestDistance=d;}}
    if(!nearest || nearestDistance>MAX_DISTANCE){uncovered++;associations.push({distanceKm:sample.distanceKm,stationId:null,stationDistanceMeters:null});continue;}
    associations.push({distanceKm:sample.distanceKm,stationId:nearest.id,stationDistanceMeters:nearestDistance*1000});
    const previous=used.get(nearest.id);
    used.set(nearest.id,{...nearest,maxDistanceMeters:Math.max(previous?.maxDistanceMeters || 0,nearestDistance*1000)});
  }
  const stations=[...used.values()];
  const status=data.partial || uncovered ? (stations.length?'partial':'unavailable') : 'available';
  const readingsValidUntil=stations.length?Math.min(...stations.map(s=>Date.parse(s.end)+MAX_AGE)):null;
  const validUntil=readingsValidUntil===null?null:new Date(Math.min(queriedAt+60000,readingsValidUntil)).toISOString();
  return {status,maxMm:stations.length?Math.max(...stations.map(s=>s.value)):null,stations,samples:associations,queriedAt:data.queriedAt,validUntil,readingsValidUntil:readingsValidUntil===null?null:new Date(readingsValidUntil).toISOString(),uncoveredSamples:uncovered,totalSamples:samples.length};
}
