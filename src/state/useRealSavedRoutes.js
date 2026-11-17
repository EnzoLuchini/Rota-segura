import {useCallback,useEffect,useRef,useState} from 'react';

export const REAL_SAVED_ROUTES_KEY='rota-segura-rotas-reais-v1';

export function useRealSavedRoutes({userId=null,store=null,authLoading=false}={}){
  const [initial]=useState(()=>{
    try {const data=JSON.parse(localStorage.getItem(REAL_SAVED_ROUTES_KEY) || '[]');if(!Array.isArray(data))throw Error();return {routes:data,error:''};}
    catch {return {routes:[],error:'Não foi possível ler as rotas deste navegador; os dados existentes não serão alterados.'};}
  });
  const [guestRoutes,setGuestRoutes]=useState(initial.routes);
  const [guestError,setGuestError]=useState(initial.error);
  const [account,setAccount]=useState({userId:null,routes:[],error:'',loading:true});
  const activeUser=useRef(userId);activeUser.current=userId;
  const pending=useRef(false);
  useEffect(()=>{
    if(!userId || !store)return;
    let active=true;
    setAccount({userId,routes:[],error:'',loading:true});
    store.list(userId).then(routes=>{if(active)setAccount({userId,routes,error:'',loading:false});}).catch(()=>{if(active)setAccount({userId,routes:[],error:'Não foi possível carregar as rotas da conta. Tente novamente mais tarde.',loading:false});});
    return()=>{active=false;};
  },[userId,store]);
  const save=useCallback(next=>{
    if(authLoading)return false;
    if(!userId){
      if(initial.error)return false;
      try {localStorage.setItem(REAL_SAVED_ROUTES_KEY,JSON.stringify(next));setGuestRoutes(next);setGuestError('');return true;}
      catch {setGuestError('Não foi possível salvar neste navegador. Verifique o armazenamento e tente novamente.');return false;}
    }
    if(!store || account.userId!==userId || account.loading || account.error || pending.current)return false;
    pending.current=true;
    return (async()=>{
      try {
        await store.save(userId,next,account.routes);
        if(activeUser.current===userId)setAccount({userId,routes:next,error:'',loading:false});
        return activeUser.current===userId;
      } catch {
        if(activeUser.current===userId)setAccount(current=>({...current,error:'Não foi possível salvar as rotas da conta. Recarregue a página e tente novamente.'}));
        return false;
      } finally {pending.current=false;}
    })();
  },[authLoading,userId,store,account,initial]);
  if(authLoading)return [[],()=>false,'', {loading:true,account:false}];
  if(!userId)return [guestRoutes,save,guestError,{loading:false,account:false}];
  if(account.userId!==userId)return [[],save,'',{loading:true,account:true}];
  return [account.routes,save,account.error,{loading:account.loading,account:true}];
}
