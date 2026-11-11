import {useCallback,useState} from 'react';

export const REAL_SAVED_ROUTES_KEY='rota-segura-rotas-reais-v1';

export function useRealSavedRoutes(){
  const [initial]=useState(()=>{
    try {const data=JSON.parse(localStorage.getItem(REAL_SAVED_ROUTES_KEY) || '[]');if(!Array.isArray(data))throw Error();return {routes:data,error:''};}
    catch {return {routes:[],error:'Não foi possível ler as rotas deste navegador; os dados existentes não serão alterados.'};}
  });
  const [error,setError]=useState(initial.error);
  const [routes,setRoutes]=useState(initial.routes);
  const save=useCallback(next=>{
    if(initial.error)return false;
    try {localStorage.setItem(REAL_SAVED_ROUTES_KEY,JSON.stringify(next));setRoutes(next);setError('');return true;}
    catch {setError('Não foi possível salvar neste navegador. Verifique o armazenamento e tente novamente.');return false;}
  },[initial]);
  return [routes,save,error];
}
