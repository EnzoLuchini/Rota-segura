import {booleanIntersects, lineString, nearestPointOnLine} from '@turf/turf';

const status = data => !data ? 'unavailable' : data.truncated ? 'partial' : 'available';
export function analyzeFloodContext(route,{history,areas}) {
  const events = (history?.features || []).map(feature => {
    const nearest=nearestPointOnLine(route,feature,{units:'meters'});
    return {id:feature.id,coordinates:feature.geometry.coordinates,segmentIndex:Math.min(nearest.properties.index,route.geometry.coordinates.length-2),distanceMeters:nearest.properties.dist,date:feature.properties?.dt_ocorrencia || null,loadedAt:feature.properties?.dt_carga || null,type:feature.properties?.dc_tipo_ocorrencia || null};
  }).filter(event=>event.distanceMeters<=100);
  const analyzedAreas=Object.fromEntries(Object.entries(areas).map(([period,data])=>{
    const indexes=new Set();
    for(const area of data?.features || []) {
      if(!booleanIntersects(route,area)) continue;
      for(let i=0;i<route.geometry.coordinates.length-1;i++) {
        if(booleanIntersects(lineString(route.geometry.coordinates.slice(i,i+2)),area)) indexes.add(i);
      }
    }
    return [period,{status:status(data),segmentIndexes:[...indexes].sort((a,b)=>a-b)}];
  }));
  return {history:{status:status(history),events},areas:analyzedAreas};
}
