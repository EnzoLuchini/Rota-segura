import {createClient} from '@supabase/supabase-js';

export function createPushStore(url,key){
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  async function checked(result){if(result.error)throw result.error;return result.data;}
  return {
    async getDevice(id){return checked(await db.from('push_devices').select('*').eq('id',id).maybeSingle());},
    async createDevice(device){return checked(await db.from('push_devices').insert(device));},
    async updateDevice(id,tokenHash,device){return checked(await db.from('push_devices').update(device).eq('id',id).eq('token_hash',tokenHash).select('id'));},
    async deleteDevice(id,tokenHash){return checked(await db.from('push_devices').delete().eq('id',id).eq('token_hash',tokenHash));},
    async listDevices(){const all=[];for(let from=0;;from+=500){const rows=await checked(await db.from('push_devices').select('id,subscription,routes').order('id').range(from,from+499));all.push(...rows);if(rows.length<500)return all;}},
    async expireDevices(before){await checked(await db.from('push_devices').delete().lt('updated_at',before));},
    async expireDeliveries(before){await checked(await db.from('push_deliveries').delete().lt('created_at',before));},
    async removeDevice(id){await checked(await db.from('push_devices').delete().eq('id',id));},
    async claim(id,key){const result=await db.from('push_deliveries').insert({device_id:id,delivery_key:key});if(result.error?.code==='23505')return false;if(result.error)throw result.error;return true;},
    async release(id,key){await checked(await db.from('push_deliveries').delete().eq('device_id',id).eq('delivery_key',key));},
  };
}
