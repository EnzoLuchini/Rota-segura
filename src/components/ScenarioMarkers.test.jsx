import React from 'react';
import {render,screen} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
vi.mock('react-leaflet',()=>({
  Marker:({children,title})=><div role="button" aria-label={title}>{children}</div>,
  Popup:({children})=><div>{children}</div>,
  useMapEvents:()=>({getZoom:()=>14,project:([lat,lon])=>({x:lon*100,y:lat*100})})
}));
import ScenarioMarkers from './ScenarioMarkers';
it('reúne relatos simulados próximos e mantém os detalhes de cada um disponíveis',()=>{
  const events=[{id:'one',title:'Alagamento simulado',position:[-23.5,-46.6],detail:'Via bloqueada',source:'Fonte fictícia'}, {id:'two',title:'Relato local',position:[-23.501,-46.601],detail:'Rua com água',source:'Relato comunitário'}];
  render(<ScenarioMarkers events={events} icons={{flood:{}}} markers={{current:{}}}/>);
  expect(screen.getByRole('button',{name:'2 avisos simulados próximos'})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'2 avisos simulados próximos'})).toHaveTextContent('Via bloqueada');
  expect(screen.getByRole('button',{name:'2 avisos simulados próximos'})).toHaveTextContent('Rua com água');
});
