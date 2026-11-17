export function createSavedRouteStore(client){
  return {
    async list(userId){
      const {data,error}=await client.from('saved_routes').select('route').eq('user_id',userId);
      if(error)throw error;
      return data.map(row=>row.route);
    },
    async save(userId,next,previous){
      const before=new Map(previous.map(route=>[route.id,route]));
      const after=new Map(next.map(route=>[route.id,route]));
      const changed=next.filter(route=>JSON.stringify(route)!==JSON.stringify(before.get(route.id)));
      const removed=previous.filter(route=>!after.has(route.id)).map(route=>route.id);
      if(changed.length){
        const {error}=await client.from('saved_routes').upsert(changed.map(route=>({user_id:userId,route_id:route.id,route})),{onConflict:'user_id,route_id'});
        if(error)throw error;
      }
      if(removed.length){
        const {error}=await client.from('saved_routes').delete().eq('user_id',userId).in('route_id',removed);
        if(error)throw error;
      }
    }
  };
}
