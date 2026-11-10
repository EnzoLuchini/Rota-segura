import {booleanPointInPolygon, point} from '@turf/turf';

const geoBase = 'https://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs';
const cityBase = 'https://geodados.daee.sp.gov.br/geoserver/sibh/wfs';
const cache = new Map();
async function json(url, options = {}) {
  const response = await fetch(url, {...options, signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error(`Serviço externo indisponível (${response.status}).`);
  return response.json();
}
async function wfs(base, typeName, extra = {}) {
  const url = new URL(base);
  Object.entries({service:'WFS',version:'1.0.0',request:'GetFeature',typeName,outputFormat:'application/json',srsName:'EPSG:4326',...extra}).forEach(([k,v]) => url.searchParams.set(k,v));
  const data = await json(url);
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Resposta geográfica inválida.');
  return data;
}
async function cached(key, load) {
  const current = cache.get(key);
  if (current && current.until > Date.now()) return current.value;
  const value = await load();
  cache.set(key, {value, until:Date.now()+3600000});
  return value;
}
export async function cityBoundary() {
  return cached('city', async () => {
    const data = await wfs(cityBase, 'sibh:municipios_sp', {CQL_FILTER:"cd_mun='3550308'"});
    if (data.features.length !== 1 || !['Polygon','MultiPolygon'].includes(data.features[0].geometry?.type)) throw new Error('Limite municipal indisponível.');
    return data.features[0];
  });
}
export async function riskAreas() {
  return cached('risk', async () => {
    const data = await wfs(geoBase, 'geoportal:risco_hidrologico', {maxFeatures:'5000'});
    if (typeof data.totalFeatures !== 'number' || data.totalFeatures !== data.features.length || data.features.some(f => !['Polygon','MultiPolygon'].includes(f.geometry?.type))) throw new Error('Camada de risco incompleta.');
    return data.features;
  });
}
export async function streams(bbox) {
  const data = await wfs(geoBase, 'geoportal:drenagem', {bbox:`${bbox.join(',')},EPSG:4326`,maxFeatures:'3000'});
  return {type:'FeatureCollection', features:data.features, truncated:typeof data.totalFeatures !== 'number' || data.totalFeatures > data.features.length};
}
export async function findPlaces(query, city, key) {
  const url = new URL('https://api.heigit.org/pelias/v1/search');
  Object.entries({text:query,'boundary.rect.min_lon':'-46.85','boundary.rect.max_lon':'-46.35','boundary.rect.min_lat':'-24.05','boundary.rect.max_lat':'-23.35',size:'10'}).forEach(([k,v]) => url.searchParams.set(k,v));
  const data = await json(url, {headers:{Authorization:key}});
  if (!Array.isArray(data.features)) throw new Error('Resposta de busca inválida.');
  return data.features.filter(f => f.geometry?.type === 'Point' && booleanPointInPolygon(point(f.geometry.coordinates), city)).map(f => ({label:f.properties.label, coordinates:f.geometry.coordinates}));
}
export async function drivingRoutes(origin, destination, key) {
  const data = await json('https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson', {method:'POST',headers:{Authorization:key,'Content-Type':'application/json'},body:JSON.stringify({coordinates:[origin,destination],alternative_routes:{target_count:3,weight_factor:1.6,share_factor:0.6}})});
  if (!Array.isArray(data.features) || data.features.some(f => f.geometry?.type !== 'LineString')) throw new Error('Resposta de rotas inválida.');
  return data.features;
}
