import {along, distance, length, point} from '@turf/turf';

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
  for(let km=0;km<routeLength;km+=SAMPLE_KM) samples.push(along(route,km,{units:'kilometers'}));
  samples.push(along(route,routeLength,{units:'kilometers'}));
  const used=new Map();let uncovered=0;
  for(const sample of samples){
    let nearest=null, nearestDistance=Infinity;
    for(const station of valid){const d=distance(sample,point(station.coordinates),{units:'kilometers'});if(d<nearestDistance){nearest=station;nearestDistance=d;}}
    if(!nearest || nearestDistance>MAX_DISTANCE){uncovered++;continue;}
    const previous=used.get(nearest.id);
    used.set(nearest.id,{...nearest,maxDistanceMeters:Math.max(previous?.maxDistanceMeters || 0,nearestDistance*1000)});
  }
  const stations=[...used.values()];
  const status=data.partial || uncovered ? (stations.length?'partial':'unavailable') : 'available';
  const readingsValidUntil=stations.length?Math.min(...stations.map(s=>Date.parse(s.end)+MAX_AGE)):null;
  const validUntil=readingsValidUntil===null?null:new Date(Math.min(queriedAt+60000,readingsValidUntil)).toISOString();
  return {status,maxMm:stations.length?Math.max(...stations.map(s=>s.value)):null,stations,queriedAt:data.queriedAt,validUntil,readingsValidUntil:readingsValidUntil===null?null:new Date(readingsValidUntil).toISOString(),uncoveredSamples:uncovered,totalSamples:samples.length};
}

export function scoreRoutes(items) {
  if(items.length===0) return {scores:[],recommended:-1,reason:'no_routes'};
  if(items.length===1) return {scores:[null],recommended:-1,reason:'single_route'};
  if(items.some(x=>[x.exposureMeters,x.historyCount,x.rainMm].some(v=>!Number.isFinite(v) || v<0))) return {scores:items.map(()=>null),recommended:-1,reason:'sources_incomplete'};
  const keys=['exposureMeters','historyCount','rainMm'], weights=[0.5,0.3,0.2];
  const bounds=keys.map(k=>[Math.min(...items.map(x=>x[k])),Math.max(...items.map(x=>x[k]))]);
  const scores=items.map(item=>100*keys.reduce((sum,key,i)=>sum+weights[i]*(bounds[i][1]===bounds[i][0]?0:(item[key]-bounds[i][0])/(bounds[i][1]-bounds[i][0])),0));
  const order=scores.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value);
  return order[1].value-order[0].value<1?{scores,recommended:-1,reason:'score_tie'}:{scores,recommended:order[0].index,reason:'lowest_combined_score'};
}
