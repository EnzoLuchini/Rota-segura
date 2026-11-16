import {booleanIntersects,lineString} from '@turf/turf';
const validRoute=geometry=>geometry?.type==='LineString' && Array.isArray(geometry.coordinates) && geometry.coordinates.length>=2 && geometry.coordinates.every(point=>Array.isArray(point) && point.length===2 && point.every(Number.isFinite) && Math.abs(point[0])<=180 && Math.abs(point[1])<=90);

export function routeAlertMatch(geometry,alert){
  if(!validRoute(geometry) || !Array.isArray(alert?.areas) || !alert.areas.length)return null;
  try{
    const route=lineString(geometry.coordinates);
    let matched=false;
    for(const area of alert.areas){
      const shape=area?.type==='Feature'?area.geometry:area;
      if(!['Polygon','MultiPolygon'].includes(shape?.type) || !Array.isArray(shape.coordinates) || !shape.coordinates.length)return null;
      if(booleanIntersects(route,area))matched=true;
    }
    return matched;
  }catch{return null;}
}

export function routeAlertSummary(route,alerts){
  if(!validRoute(route.geometry))return {status:'unknown',matches:[]};
  const results=alerts.map(alert=>({alert,match:routeAlertMatch(route.geometry,alert)}));
  return {status:results.some(item=>item.match===null)?'unknown':'available',matches:results.filter(item=>item.match===true).map(item=>item.alert)};
}
