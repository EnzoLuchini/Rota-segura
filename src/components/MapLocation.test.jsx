import React from 'react';
import {act,render,screen} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import MapLocation from './MapLocation';
const {setView,map}=vi.hoisted(()=>{const setView=vi.fn();return {setView,map:{setView}};});
vi.mock('react-leaflet',()=>({useMap:()=>map,CircleMarker:({children,center})=><div data-testid="location-marker" data-center={center.join(',')}>{children}</div>,Popup:({children})=><span>{children}</span>}));
afterEach(()=>{vi.unstubAllGlobals();setView.mockClear();});
it('solicita localização ao clicar e destaca a posição no mapa',()=>{
 const getCurrentPosition=vi.fn(success=>success({coords:{latitude:-23.55,longitude:-46.63}}));
 vi.stubGlobal('navigator',{geolocation:{getCurrentPosition}});
 const {rerender}=render(<MapLocation request={0} onStatus={()=>{}}/>);
 expect(getCurrentPosition).not.toHaveBeenCalled();
 rerender(<MapLocation request={1} onStatus={()=>{}}/>);
 expect(setView).toHaveBeenCalledWith([-23.55,-46.63],16);
 expect(screen.getByTestId('location-marker')).toHaveAttribute('data-center','-23.55,-46.63');
});
it('informa quando a permissão de localização é negada',()=>{
 const onStatus=vi.fn();vi.stubGlobal('navigator',{geolocation:{getCurrentPosition:(_ok,fail)=>fail({code:1})}});
 const {rerender}=render(<MapLocation request={0} onStatus={onStatus}/>);
 rerender(<MapLocation request={1} onStatus={onStatus}/>);
 expect(onStatus).toHaveBeenLastCalledWith(expect.stringMatching(/permissão.*negada/i));
});
it('remove a confirmação de localização após alguns segundos',()=>{
 vi.useFakeTimers();
 try{
  const onStatus=vi.fn();vi.stubGlobal('navigator',{geolocation:{getCurrentPosition:success=>success({coords:{latitude:-23.55,longitude:-46.63}})}});
  const {rerender}=render(<MapLocation request={0} onStatus={onStatus}/>);
  rerender(<MapLocation request={1} onStatus={onStatus}/>);
  expect(onStatus).toHaveBeenLastCalledWith('Localização encontrada no mapa.');
  act(()=>vi.advanceTimersByTime(4000));expect(onStatus).toHaveBeenLastCalledWith('');
 }finally{vi.useRealTimers();}
});
