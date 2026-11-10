import {booleanIntersects, booleanPointInPolygon, featureCollection, length, lineSplit, along, union} from '@turf/turf';

function merged(polygons) {
  if (polygons.length === 0) return null;
  return polygons.length === 1 ? polygons[0] : union(featureCollection(polygons));
}

function pieces(line, polygon) {
  const split = lineSplit(line, polygon).features;
  return split.length ? split : [line];
}

function midpoint(line) {
  return along(line, length(line) / 2);
}

export function routeWithinCity(line, city) {
  if (!city || line?.geometry?.type !== 'LineString') return false;
  return pieces(line, city).every(piece => booleanPointInPolygon(midpoint(piece), city));
}

export function analyzeRoutes(routes, polygons) {
  if (polygons === null) return routes.map(route => ({route, exposureMeters:null}));
  const area = merged(polygons);
  return routes.map(route => ({route, evidence:polygons.filter(p => booleanIntersects(route,p)).map(p => ({name:p.properties?.nm_area_risco_hidrologico || 'Área mapeada',date:p.properties?.dt_vistoria || null,classification:p.properties?.tx_grau_risco_hidrologico || null})), exposureMeters: area ? pieces(route, area)
    .filter(piece => booleanPointInPolygon(midpoint(piece), area))
    .reduce((sum, piece) => sum + length(piece) * 1000, 0) : 0}));
}
