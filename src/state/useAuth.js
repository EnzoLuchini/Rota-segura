import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';

const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const client=url && key && !key.startsWith('sb_secret_') ? createClient(url,key) : null;

export function useAuth(enabled=true) {
  const [user,setUser]=useState(null);
  const [recovering,setRecovering]=useState(false);
  const [loading,setLoading]=useState(Boolean(enabled && client));
  useEffect(()=>{
    if(!enabled || !client)return;
    const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY')setRecovering(true);
      if(event==='SIGNED_OUT')setRecovering(false);
      setUser(session?.user || null);
      setLoading(false);
    });
    return()=>subscription.unsubscribe();
  },[enabled]);
  const requireClient=()=>{if(!client)throw new Error('Auth indisponível');return client;};
  return {
    configured:Boolean(client),user,loading,recovering,
    async signIn(email,password){const {data,error}=await requireClient().auth.signInWithPassword({email,password});if(error)throw error;return data;},
    async signUp(email,password){const {data,error}=await requireClient().auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/`}});if(error)throw error;return data;},
    async signOut(){const {error}=await requireClient().auth.signOut();if(error)throw error;},
    async resetPassword(email){const {error}=await requireClient().auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/`});if(error)throw error;},
    async updatePassword(password){const {error}=await requireClient().auth.updateUser({password});if(error)throw error;setRecovering(false);},
  };
}
