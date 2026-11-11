import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({zoom:13,handlers:null}));
vi.mock('react-leaflet',()=>({
  GeoJSON:()=>null,ImageOverlay:()=>null,Polyline:()=>null,Circle:()=>null,
  Marker:({children,title})=><div role="button" aria-label={title}>{children}</div>,Popup:({children})=><div>{children}</div>,
  useMap:()=>null,
  useMapEvents:handlers=>{state.handlers=handlers;return {getZoom:()=>state.zoom,project:([lat,lon])=>({x:lon*100,y:lat*100}),getBounds:()=>({getWest:()=>-46.7,getEast:()=>-46.6,getSouth:()=>-23.6,getNorth:()=>-23.5})};}
}));
import {HistoricalOccurrences} from './RealLayers';
afterEach(()=>vi.unstubAllGlobals());

it('agrupa registros da rota e do mapa sem duplicar e mantém a distância disponível',async()=>{
  const feature={id:'route-event',geometry:{type:'Point',coordinates:[-46.65,-23.55]},properties:{dc_tipo_ocorrencia:'ALAGAMENTO',nm_subprefeitura:'Centro'}};
  const nearby={id:'nearby',geometry:{type:'Point',coordinates:[-46.64,-23.55]},properties:{dc_tipo_ocorrencia:'INUNDACAO'}};
  vi.stubGlobal('fetch',vi.fn(async url=>({ok:true,json:async()=>({features:url.includes('kind=alagamento')?[feature,nearby]:[],truncated:false})})));
  const routeEvents=[{id:'route-event',coordinates:[-46.65,-23.55],type:'ALAGAMENTO',distanceMeters:15,date:'2026-01-01'}];
  render(<HistoricalOccurrences enabled routeEvents={routeEvents}/>);
  await waitFor(()=>expect(screen.getByRole('button',{name:'2 registros históricos próximos'})).toBeInTheDocument());
  expect(screen.getByText('A 15 m da rota')).toBeInTheDocument();
  expect(screen.getByText('Centro')).toBeInTheDocument();
});

it('mantém registro da rota visível quando a camada histórica está desligada',()=>{
  render(<HistoricalOccurrences enabled={false} routeEvents={[{id:'r',coordinates:[-46.65,-23.55],type:'INUNDACAO',distanceMeters:20}]}/>);
  expect(screen.getByRole('button',{name:'Registro histórico de inundação'})).toBeInTheDocument();
  expect(screen.getByText('A 20 m da rota')).toBeInTheDocument();
});
