import React from 'react';
import {fireEvent,render,screen} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
vi.mock('react-leaflet',()=>({GeoJSON:()=>null,WMSTileLayer:()=>null,Polyline:()=>null,Circle:props=><div data-testid="reference-circle">{props.radius}</div>,Marker:({children,eventHandlers})=><button onClick={()=>eventHandlers?.popupopen?.()}>{children}</button>,Popup:({children})=><span>{children}</span>,useMap:()=>null,useMapEvents:()=>null}));
import {RouteFloodHighlights} from './RealLayers';

it('mostra um raio de referência somente ao abrir o registro da rota',()=>{
  const route={geometry:{coordinates:[[-46.7,-23.6],[-46.6,-23.5]]},floodContext:{history:{events:[{id:'a',coordinates:[-46.65,-23.55],type:'INUNDACAO',date:'2026-01-01Z'}]},areas:{5:{segmentIndexes:[]}}}};
  render(<RouteFloodHighlights route={route}/>);
  expect(screen.queryByTestId('reference-circle')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByTestId('reference-circle')).toHaveTextContent('100');
  expect(screen.getByText(/não representa a extensão real/i)).toBeInTheDocument();
});
