import {booleanIntersects, length, lineSliceAlong, lineString, nearestPointOnLine, point} from '@turf/turf';

// Distâncias são aproximadas e seguem a geometria, não nomes de vias.
export function buildRouteSegments(route, riskAreas) {
  if (!route?.geometry?.coordinates || route.geometry.coordinates.length<2) return [];
  const line=lineString(route.geometry.coordinates), total=length(line,{units:'kilometers'});
  if (!Number.isFinite(total) || total<=0) return [];
  const count=Math.ceil(total/0.5), segments=Array.from({length:count},(_,index)=>{
    const startKm=index*0.5, endKm=Math.min(total,(index+1)*0.5);
    const piece=lineSliceAlong(line,startKm,endKm,{units:'kilometers'});
    return {startKm,endKm,geometry:piece.geometry,events:[],samples:[],riskCrossing:Array.isArray(riskAreas)?riskAreas.some(area=>booleanIntersects(piece,area)):null};
  });
  const indexAt=km=>Math.min(count-1,Math.max(0,Math.floor(km/0.5)));
  const seen=new Set();
  for(const event of route.floodContext?.history?.events || []) {
    if (!Array.isArray(event.coordinates)) continue;
    const id=event.id == null || String(event.id).trim()==='' ? null : JSON.stringify([event.kind,String(event.id)]);
    if(id && seen.has(id)) continue;
    if(id)seen.add(id);
    const km=nearestPointOnLine(line,point(event.coordinates),{units:'kilometers'}).properties.location;
    if(Number.isFinite(km))segments[indexAt(km)].events.push(event);
  }
  for(const sample of route.rain?.samples || []) if(Number.isFinite(sample.distanceKm)) segments[indexAt(sample.distanceKm)].samples.push(sample);
  return segments;
}
