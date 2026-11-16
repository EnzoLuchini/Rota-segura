import {act,renderHook} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {useRouteTracking} from '../state/useRouteTracking';

afterEach(()=>{delete navigator.geolocation;});
it('acompanha a posição e encerra a observação ao parar',()=>{
  let success;
  const clearWatch=vi.fn();
  const watchPosition=vi.fn(callback=>{success=callback;return 42;});
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition,clearWatch}});
  const {result}=renderHook(()=>useRouteTracking());
  act(()=>result.current.start());
  expect(watchPosition).toHaveBeenCalledTimes(1);
  act(()=>success({coords:{latitude:-23.55,longitude:-46.63,accuracy:12},timestamp:Date.now()}));
  expect(result.current.position).toEqual({latitude:-23.55,longitude:-46.63,accuracy:12});
  act(()=>result.current.stop());
  expect(clearWatch).toHaveBeenCalledWith(42);
  expect(result.current.position).toBeNull();
  act(()=>success({coords:{latitude:-23.55,longitude:-46.63,accuracy:12}}));
  expect(result.current.position).toBeNull();
});

it('informa a recusa de permissão',()=>{
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition:(_ok,fail)=>{fail({code:1});return 1;},clearWatch:vi.fn()}});
  const {result}=renderHook(()=>useRouteTracking());
  act(()=>result.current.start());
  expect(result.current.error).toMatch(/permissão/i);
});
