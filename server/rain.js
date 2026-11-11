const endpoint='https://apps.spaguas.sp.gov.br/sibh/api/v2/measurements/now?station_type_id=2&hours=1&show_all=false&serializer=complete&public=true';
const number=value => value === null || value === undefined || String(value).trim()==='' ? NaN : Number(value);
function timestamp(value) {
  if (typeof value!=='string') return NaN;
  const parts=/^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts) return NaN;
  const year=Number(parts[1]),month=Number(parts[2]),day=Number(parts[3]);
  if (year<1000 || month<1 || month>12 || day<1 || day>new Date(Date.UTC(year,month,0)).getUTCDate()) return NaN;
  return Date.parse(value);
}

export function createRainProvider({fetch:load=globalThis.fetch,now=Date.now}={}) {
  let cache=null, pending=null;
  return async function rain() {
    const current=now();
    if (cache && current-cache.time<60000) return cache.data;
    if (pending) return pending;
    pending=(async()=>{
    const response=await load(endpoint,{signal:AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error('SIBH indisponível.');
    const data=await response.json();
    if (!Array.isArray(data?.measurements)) throw new Error('Resposta SIBH inválida.');
    let partial=false;
    const stations=data.measurements.flatMap(item=>{
      if (!item || String(item.cod_ibge)!=='3550308') return [];
      const lat=number(item.latitude), lon=number(item.longitude), value=number(item.value);
      const start=timestamp(item.min_date), end=timestamp(item.max_date);
      if (typeof item.station_name==='string' && /\bradar\b/i.test(item.station_name)) return [];
      if (!item.station_prefix_id || typeof item.station_name!=='string' || !item.station_name.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || lon < -46.95 || lon > -46.30 || lat < -24.1 || lat > -23.3 || !Number.isFinite(value) || value<0 || !Number.isFinite(start) || !Number.isFinite(end) || start>end || end>current+300000) {partial=true;return [];}
      return [{id:String(item.station_prefix_id),name:item.station_name.trim(),coordinates:[lon,lat],value,start:new Date(start).toISOString(),end:new Date(end).toISOString(),owner:typeof item.station_owner==='string'?item.station_owner.trim():'',stale:current-end>90*60000}];
    });
    const result={stations,partial,queriedAt:new Date(current).toISOString()};
    cache={data:result,time:current};
    return result;
    })();
    try {return await pending;} finally {pending=null;}
  };
}
