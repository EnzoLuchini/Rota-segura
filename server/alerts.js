import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {booleanIntersects,polygon} from '@turf/turf';
import {cityBoundary} from './providers.js';

const feedUrl='https://apiprevmet3.inmet.gov.br/avisos/rss';
const parser=new XMLParser({ignoreAttributes:true,processEntities:true,parseTagValue:false,trimValues:true});
const array=value=>value == null ? [] : Array.isArray(value) ? value : [value];
const text=value=>typeof value==='string'?value.trim():'';
function time(value){
  const match=typeof value==='string' && /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if(!match)return NaN;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  if(year<1000 || month<1 || month>12 || day<1 || day>new Date(Date.UTC(year,month,0)).getUTCDate())return NaN;
  return Date.parse(value);
}

async function readXml(load,url,maxBytes,deadline) {
  const signal=deadline ? AbortSignal.any([deadline,AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000);
  const response=await load(url,{signal,redirect:'error'});
  if(!response.ok || !response.body)throw new Error('Fonte indisponível.');
  const reader=response.body.getReader(), chunks=[];let size=0;
  try {while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw Error('Resposta muito grande.');chunks.push(value);}} finally {await reader.cancel().catch(()=>{});}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const xml=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml) || XMLValidator.validate(xml)!==true)throw Error('XML inválido.');
  return parser.parse(xml);
}

function shape(raw) {
  const points=text(raw).split(/\s+/).map(pair=>pair.split(',').map(Number));
  if(points.length<4 || points.length>10000 || points.some(p=>p.length!==2 || !p.every(Number.isFinite) || Math.abs(p[0])>90 || Math.abs(p[1])>180))throw Error('Polígono inválido.');
  const coordinates=points.map(([lat,lon])=>[lon,lat]);
  if(coordinates[0][0]!==coordinates.at(-1)[0] || coordinates[0][1]!==coordinates.at(-1)[1])throw Error('Polígono aberto.');
  return polygon([coordinates]);
}

function parseCap(document,id,city) {
  const cap=document?.alert;
  if(!cap || !text(cap.identifier) || !text(cap.sender) || !Number.isFinite(time(text(cap.sent))))throw Error('CAP inválido.');
  if(cap.status!=='Actual' || cap.scope!=='Public')return {ignored:true};
  if(!['Alert','Update','Cancel'].includes(cap.msgType))throw Error('Tipo de CAP não reconhecido.');
  const references=text(cap.references).split(/\s+/).filter(Boolean).map(ref=>{
    const parts=ref.split(',');if(parts.length!==3 || !parts[0] || !parts[1] || !Number.isFinite(time(parts[2])))throw Error('Referência inválida.');
    return `${parts[0]}|${parts[1]}`;
  });
  if(cap.msgType!=='Alert' && !references.length)throw Error('Referência ausente.');
  const key=`${text(cap.sender)}|${text(cap.identifier)}`;
  if(cap.msgType==='Cancel')return {key,references,items:[]};
  const infos=array(cap.info).filter(info=>!info.language || /^pt(?:-BR)?$/i.test(info.language));
  if(!infos.length)throw Error('Informação CAP indisponível.');
  const items=[];
  for(const info of infos){
    const start=time(text(info.onset || info.effective)),end=time(text(info.expires));
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start || !text(info.event) || !text(info.severity))throw Error('Vigência CAP inválida.');
    const areas=array(info.area);if(!areas.length)throw Error('Área CAP indisponível.');
    let intersects=false;
    for(const area of areas){const polygons=array(area.polygon);if(!polygons.length || area.circle)throw Error('Geometria CAP não suportada.');for(const item of polygons){if(booleanIntersects(city,shape(item)))intersects=true;}}
    if(intersects)items.push({id:text(cap.identifier),event:text(info.event),severity:text(info.severity),headline:text(info.headline)||text(info.event),description:text(info.description),start:new Date(start).toISOString(),end:new Date(end).toISOString(),url:`https://avisos.inmet.gov.br/${id}`,source:'INMET'});
  }
  return {key,references,items};
}

export function createAlertsProvider({fetch:load=globalThis.fetch,now=Date.now,cityBoundary:loadCity=cityBoundary,deadlineMs=30000}={}) {
  let cache=null,pending=null;
  async function refresh(){
    const deadline=AbortSignal.timeout(deadlineMs);
    const [feed,city]=await Promise.all([readXml(load,feedUrl,2*1024*1024,deadline),loadCity()]);
    if(!feed?.rss?.channel || !city)throw Error('Fonte de avisos indisponível.');
    const entries=array(feed.rss.channel.item);let partial=entries.length>100;
    const ids=[];
    for(const item of entries.slice(0,100)){
      const link=text(item?.link),match=/^https:\/\/apiprevmet3\.inmet\.gov\.br\/avisos\/rss\/(\d+)$/.exec(link);
      if(!match){partial=true;continue;}if(!ids.includes(match[1]))ids.push(match[1]);
    }
    const results=new Array(ids.length);let next=0;
    async function worker(){while(next<ids.length){const index=next++,id=ids[index];if(deadline.aborted){partial=true;results[index]=null;continue;}try{results[index]=parseCap(await readXml(load,`${feedUrl}/${id}`,1024*1024,deadline),id,city);}catch{partial=true;results[index]=null;}}}
    await Promise.all(Array.from({length:Math.min(ids.length,8)},()=>worker()));
    if(ids.length && results.every(value=>value===null))throw Error('Detalhes dos avisos indisponíveis.');
    const valid=results.filter(x=>x && !x.ignored), known=new Set(valid.map(x=>x.key)),superseded=new Set();
    for(const item of valid)for(const ref of item.references){if(!known.has(ref))partial=true;superseded.add(ref);}
    const items=valid.filter(item=>!superseded.has(item.key)).flatMap(item=>item.items);
    return {items,partial,checkedAt:new Date(now()).toISOString()};
  }
  return async function alerts(){
    if(!cache || now()-cache.time>=120000){
      if(!pending)pending=refresh();
      try{const data=await pending;cache={data,time:now()};}finally{pending=null;}
    }
    const current=now();
    return {status:cache.data.partial?'partial':'available',coverage:'unknown',checkedAt:cache.data.checkedAt,alerts:cache.data.items.filter(item=>Date.parse(item.start)<=current && current<Date.parse(item.end))};
  };
}
