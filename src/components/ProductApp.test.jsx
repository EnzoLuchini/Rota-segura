import React from 'react';
import {render,screen} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import userEvent from '@testing-library/user-event';
vi.mock('react-leaflet',()=>({MapContainer:({children})=><div>{children}</div>,TileLayer:()=>null,Polyline:()=>null,Polygon:()=>null,GeoJSON:()=> <div data-testid="areas-de-risco"/>,CircleMarker:({children})=><div>{children}</div>,Marker:()=>null,Popup:({children})=><div>{children}</div>,useMap:()=>({invalidateSize:()=>{},fitBounds:()=>{},setView:()=>{}}),useMapEvents:()=>null}));
import App from '../main';

it('apresenta a consulta real no próprio fluxo visual do mock sem cenário fictício',()=>{
  render(<App real/>);
  expect(screen.getByRole('heading',{name:/um caminho melhor começa com informação/i})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/explorar situação da cidade/i})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/comparar rotas/i})).toBeDisabled();
  expect(screen.getByLabelText('Origem')).toHaveValue('');
  expect(screen.queryByText(/cenário disponível:/i)).not.toBeInTheDocument();
  expect(screen.getByRole('link',{name:/abrir simulação/i})).toHaveAttribute('href','/simulacao');
});

it('usa a busca real na tela do mock e preserva a comparação e o retorno',async()=>{
  const user=userEvent.setup();
  const response=value=>Promise.resolve({ok:true,json:async()=>value});
  vi.stubGlobal('fetch',vi.fn(url=>url.includes('/api/places')?response({places:[{label:url.includes('Origem')?'Origem escolhida':'Destino escolhido',coordinates:url.includes('Origem')?[-46.7,-23.6]:[-46.6,-23.5]}]}):response({routes:[{geometry:{coordinates:[[-46.7,-23.6],[-46.6,-23.5]]},summary:{duration:900,distance:5000},exposureMeters:0,evidence:[]}],riskAvailable:true,riskAreas:[{type:'Feature',geometry:{type:'Polygon',coordinates:[]},properties:{}}]})));
  const previousScroll=HTMLElement.prototype.scrollTo; HTMLElement.prototype.scrollTo=vi.fn();
  try {
    render(<App real/>);
    await user.type(screen.getByLabelText('Origem'),'Origem');
    await user.click(screen.getAllByRole('button',{name:'Buscar'})[0]);
    await user.click(await screen.findByRole('button',{name:'Origem escolhida'}));
    await user.type(screen.getByLabelText('Destino'),'Destino');
    await user.click(screen.getAllByRole('button',{name:'Buscar'})[1]);
    await user.click(await screen.findByRole('button',{name:'Destino escolhido'}));
    await user.click(screen.getByRole('button',{name:'Comparar rotas'}));
    expect(await screen.findByRole('heading',{name:'Compare suas rotas'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:/Trajeto 1.*Selecionado/})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText('0 m do trajeto em áreas mapeadas')).toBeInTheDocument();
    await user.click(screen.getByText('Camadas do mapa'));
    await user.click(screen.getByRole('checkbox',{name:'Áreas de risco mapeadas'}));
    expect(screen.queryByTestId('areas-de-risco')).not.toBeInTheDocument();
    expect(screen.queryByText('Área de risco mapeada')).not.toBeInTheDocument();
    expect(screen.getByText('0 m do trajeto em áreas mapeadas')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox',{name:'Rios e córregos'}));
    expect(screen.queryByText('Rio ou córrego mapeado')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:/voltar ao início/i}));
    expect(screen.getByLabelText('Origem')).toHaveValue('Origem escolhida');
    expect(screen.getByLabelText('Destino')).toHaveValue('Destino escolhido');
  } finally {vi.unstubAllGlobals();HTMLElement.prototype.scrollTo=previousScroll;}
});
