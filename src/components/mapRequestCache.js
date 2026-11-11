export function createMapRequestCache({ttl=60000,maxEntries=24,now=()=>Date.now()}={}) {
  const entries=new Map(), pending=new Map();
  return {get(key,load) {
    const item=entries.get(key);
    if(item && now()-item.time<ttl) return Promise.resolve(item.value);
    if(item)entries.delete(key);
    if(pending.has(key))return pending.get(key);
    let work;
    try {work=Promise.resolve(load());} catch(error) {return Promise.reject(error);}
    const result=work.then(value=>{
      entries.delete(key);entries.set(key,{value,time:now()});
      while(entries.size>maxEntries)entries.delete(entries.keys().next().value);
      return value;
    }).finally(()=>pending.delete(key));
    pending.set(key,result);
    return result;
  }};
}
