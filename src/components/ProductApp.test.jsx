import React from 'react';
import {render,screen,within} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import userEvent from '@testing-library/user-event';
vi.mock('react-leaflet',()=>({MapContainer:({children})=><div>{children}</div>,TileLayer:({url})=><span data-testid="basemap-url">{url}</span>,Polyline:()=>null,Polygon:()=>null,GeoJSON:()=> <div data-testid="areas-de-risco"/>,CircleMarker:({children})=><div>{children}</div>,Marker:()=>null,Popup:({children})=><div>{children}</div>,useMap:()=>({invalidateSize:()=>{},fitBounds:()=>{},setView:()=>{}}),useMapEvents:()=>null}));
import App from '../main';
import {REAL_SAVED_ROUTES_KEY} from '../state/useRealSavedRoutes';

it('permite guardar a viagem real e reutilizar seus pontos depois de recarregar',async()=>{
  const user=userEvent.setup();
  const response=value=>Promise.resolve({ok:true,json:async()=>value});
  vi.stubGlobal('fetch',vi.fn(url=>url.includes('/api/places')?response({places:[{label:url.includes('Origem')?'Origem escolhida':'Destino escolhido',coordinates:url.includes('Origem')?[-46.7,-23.6]:[-46.6,-23.5]}]}):response({routes:[{geometry:{coordinates:[[-46.7,-23.6],[-46.6,-23.5]]},summary:{duration:900,distance:5000},exposureMeters:0,evidence:[]}],riskAvailable:true,riskAreas:[]})));
  const previousScroll=HTMLElement.prototype.scrollTo;HTMLElement.prototype.scrollTo=vi.fn();
  try{
    const view=render(<App real/>);
    await user.type(screen.getByLabelText('Origem'),'Origem');
    await user.click(await screen.findByRole('button',{name:'Origem escolhida'}));
    await user.type(screen.getByLabelText('Destino'),'Destino');
    await user.click(await screen.findByRole('button',{name:'Destino escolhido'}));
    await user.click(screen.getByRole('button',{name:'Comparar rotas'}));
    await user.click(await screen.findByRole('button',{name:/salvar como rota frequente/i}));
    await user.click(screen.getByRole('button',{name:/salvar neste navegador/i}));
    expect(screen.getByText(/Origem escolhida.*Destino escolhido/)).toBeInTheDocument();
    view.unmount();render(<App real/>);
    await user.click(screen.getByRole('button',{name:'Minhas rotas'}));
    await user.click(screen.getByRole('button',{name:/consultar novamente/i}));
    expect(screen.getByLabelText('Origem')).toHaveValue('Origem escolhida');
    expect(screen.getByLabelText('Destino')).toHaveValue('Destino escolhido');
    expect(screen.getByRole('button',{name:'Comparar rotas'})).toBeEnabled();
  }finally{localStorage.removeItem(REAL_SAVED_ROUTES_KEY);vi.unstubAllGlobals();HTMLElement.prototype.scrollTo=previousScroll;}
});

it('apresenta a consulta real no próprio fluxo visual do mock sem cenário fictício',()=>{
  render(<App real/>);
  expect(screen.getAllByTestId('basemap-url').map(item=>item.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('World_Light_Gray_Base'),expect.stringContaining('World_Light_Gray_Reference')]));
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
  vi.stubGlobal('fetch',vi.fn(url=>url.includes('/api/places')?response({places:[{label:url.includes('Origem')?'Origem escolhida':'Destino escolhido',coordinates:url.includes('Origem')?[-46.7,-23.6]:[-46.6,-23.5]}]}):response({routes:[{geometry:{coordinates:[[-46.7,-23.6],[-46.6,-23.5]]},summary:{duration:900,distance:5000},exposureMeters:0,evidence:[],floodContext:{history:{status:'available',events:[{id:'1',type:'INUNDACAO',date:'2026-02-01Z',coordinates:[-46.7,-23.6],distanceMeters:20,segmentIndex:0}]},areas:{5:{status:'available',segmentIndexes:[]},25:{status:'available',segmentIndexes:[0]},100:{status:'unavailable',segmentIndexes:[]}}}}],riskAvailable:true,riskAreas:[{type:'Feature',geometry:{type:'Polygon',coordinates:[]},properties:{}}]})));
  const previousScroll=HTMLElement.prototype.scrollTo; HTMLElement.prototype.scrollTo=vi.fn();
  try {
    render(<App real/>);
    await user.type(screen.getByLabelText('Origem'),'Origem');
    await user.click(await screen.findByRole('button',{name:'Origem escolhida'}));
    await user.type(screen.getByLabelText('Destino'),'Destino');
    await user.click(await screen.findByRole('button',{name:'Destino escolhido'}));
    await user.click(screen.getByRole('button',{name:'Comparar rotas'}));
    expect(await screen.findByRole('heading',{name:'Compare suas rotas'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:/Trajeto 1.*Selecionado/})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText('0 m do trajeto em áreas mapeadas')).toBeInTheDocument();
    expect(within(screen.getByRole('region',{name:'Contexto de inundações da rota'})).getByText(/inundação.*20 m da rota/i)).toBeInTheDocument();
    expect(screen.getByText(/5 anos.*0 trecho/i)).toBeInTheDocument();
    expect(screen.getByText('Trecho que cruza mancha')).toBeInTheDocument();
    await user.click(screen.getByText('Camadas do mapa'));
    await user.click(screen.getByRole('checkbox',{name:'Áreas de risco mapeadas'}));
    expect(screen.queryByTestId('areas-de-risco')).not.toBeInTheDocument();
    expect(screen.queryByText('Área de risco mapeada')).not.toBeInTheDocument();
    expect(screen.getByText('0 m do trajeto em áreas mapeadas')).toBeInTheDocument();
    expect(screen.queryByText('Rio ou córrego mapeado')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox',{name:'Rios e córregos'}));
    expect(screen.getByText('Rio ou córrego mapeado')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox',{name:'Rios e córregos'}));
    expect(screen.queryByText('Rio ou córrego mapeado')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:/voltar ao início/i}));
    expect(screen.getByLabelText('Origem')).toHaveValue('Origem escolhida');
    expect(screen.getByLabelText('Destino')).toHaveValue('Destino escolhido');
  } finally {vi.unstubAllGlobals();HTMLElement.prototype.scrollTo=previousScroll;}
});
