import {booleanIntersects,lineString} from '@turf/turf';

export function alertIntersectsRoute(geometry,alert){
  if(geometry?.type!=='LineString' || !Array.isArray(alert?.areas))return false;
  try {const route=lineString(geometry.coordinates);return alert.areas.some(area=>booleanIntersects(route,area));}catch{return false;}
}

export function eligibleTrips(route,now=new Date()){
  const format=date=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(item=>[item.type,item.value]));
  const parts=format(now),next=format(new Date(now.getTime()+86400000));
  if(!['Segunda a sexta','Fins de semana','Todos os dias'].includes(route.days))return [];
  const current=Number(parts.hour)*60+Number(parts.minute),lead=Number(route.lead);
  if(![15,30,60].includes(lead))return [];
  return [['ida',route.outbound],['volta',route.returnTime]].flatMap(([name,time])=>{
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time || ''))return [];
    const [hour,minute]=time.split(':').map(Number);let difference=hour*60+minute-current;
    const day=difference<0 ? next : parts;
    if(difference<0)difference+=1440;
    const weekend=['Sat','Sun'].includes(day.weekday);
    if(route.days==='Segunda a sexta' && weekend || route.days==='Fins de semana' && !weekend || difference>lead)return [];
    return [`${day.year}-${day.month}-${day.day}:${name}`];
  });
}
