import React from 'react';
import {act,renderHook} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {useRealRoutes} from './RealRoutes';

afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('inicia com áreas de risco e registros históricos selecionados',()=>{
  const {result}=renderHook(()=>useRealRoutes());
  expect(result.current.risk).toBe(true);
  expect(result.current.history).toBe(true);
  expect(result.current.water).toBe(false);
});
it('reutiliza a rota apenas até vencer a validade da chuva',async()=>{
  let now=100000;
  vi.spyOn(Date,'now').mockImplementation(()=>now);
  const route={rain:{status:'available',validUntil:new Date(now+60000).toISOString()},geometry:{coordinates:[[-46.7,-23.6],[-46.6,-23.5]]},floodContext:{history:{status:'available',events:[]},areas:{5:{status:'available',segmentIndexes:[]},25:{status:'available',segmentIndexes:[]},100:{status:'available',segmentIndexes:[]}}}};
  const fetch=vi.fn(async()=>({ok:true,json:async()=>({routes:[route],riskAvailable:true,riskAreas:[],sources:{rain:{status:'available'}}})}));
  vi.stubGlobal('fetch',fetch);
  const {result}=renderHook(()=>useRealRoutes());
  act(()=>{result.current.setOrigin({coordinates:[-46.7,-23.6]});result.current.setDestination({coordinates:[-46.6,-23.5]});});
  await act(async()=>{await result.current.compare(()=>{});});
  await act(async()=>{await result.current.compare(()=>{});});
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.current.message).toMatch(/reutilizad/i);
  now+=60000;
  await act(async()=>{await result.current.compare(()=>{});});
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('não guarda resultado com fonte de risco indisponível',async()=>{
  const fetch=vi.fn(async()=>({ok:true,json:async()=>({routes:[{geometry:{coordinates:[[-46.7,-23.6],[-46.6,-23.5]]}}],riskAvailable:false,riskAreas:[]})}));
  vi.stubGlobal('fetch',fetch);
  const {result}=renderHook(()=>useRealRoutes());
  act(()=>{result.current.setOrigin({coordinates:[-46.7,-23.6]});result.current.setDestination({coordinates:[-46.6,-23.5]});});
  await act(async()=>{await result.current.compare(()=>{});});
  await act(async()=>{await result.current.compare(()=>{});});
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('descarta resultado antigo se o usuário muda o trajeto durante a consulta',async()=>{
  let resolve;
  vi.stubGlobal('fetch',vi.fn(()=>new Promise(done=>{resolve=done;})));
  const {result}=renderHook(()=>useRealRoutes());
  act(()=>{result.current.setOrigin({coordinates:[-46.7,-23.6]});result.current.setDestination({coordinates:[-46.6,-23.5]});});
  let pending;
  act(()=>{pending=result.current.compare(()=>{});});
  act(()=>{result.current.clear();result.current.setOrigin(null);});
  await act(async()=>{resolve({ok:true,json:async()=>({routes:[{geometry:{coordinates:[]}}],riskAvailable:false})});await pending;});
  expect(result.current.routes).toEqual([]);
  expect(result.current.busy).toBe(false);
});

it('preserva o motivo da comparação retornado pela API',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({routes:[{geometry:{coordinates:[[-46.7,-23.6],[-46.6,-23.5]]}}],riskAvailable:true,recommendationReason:'sources_incomplete',sources:{rain:{status:'partial'}}})})));
  const {result}=renderHook(()=>useRealRoutes());
  act(()=>{result.current.setOrigin({coordinates:[-46.7,-23.6]});result.current.setDestination({coordinates:[-46.6,-23.5]});});
  await act(async()=>{await result.current.compare(()=>{});});
  expect(result.current.recommendationReason).toBe('sources_incomplete');
  expect(result.current.sources.rain.status).toBe('partial');
});
