import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {it,expect,vi} from 'vitest';
vi.mock('react-leaflet',()=>({MapContainer:({children})=><div>{children}</div>,TileLayer:()=>null,Polyline:()=>null,Polygon:()=>null,GeoJSON:()=>null,CircleMarker:({children})=><div>{children}</div>,Marker:()=>null,Popup:({children})=><div>{children}</div>,useMap:()=>({invalidateSize:()=>{},fitBounds:()=>{},setView:()=>{}}),useMapEvents:()=>null}));
import App from '../main';

it('permite recolher e abrir o painel por botão e gesto',async()=>{
  const user=userEvent.setup();
  render(<App real/>);
  const handle=screen.getByRole('button',{name:'Recolher painel'});
  await user.click(handle);
  expect(screen.getByRole('button',{name:'Abrir painel'})).toHaveAttribute('aria-expanded','false');
  fireEvent.touchStart(handle,{touches:[{clientY:600}]});
  fireEvent.touchEnd(handle,{changedTouches:[{clientY:500}]});
  expect(screen.getByRole('button',{name:'Recolher painel'})).toHaveAttribute('aria-expanded','true');
  fireEvent.touchStart(handle,{touches:[{clientY:500}]});
  fireEvent.touchEnd(handle,{changedTouches:[{clientY:600}]});
  expect(screen.getByRole('button',{name:'Abrir painel'})).toHaveAttribute('aria-expanded','false');
});
