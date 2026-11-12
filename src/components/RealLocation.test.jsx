import React from 'react';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import {RealSearch,useRealRoutes} from './RealRoutes';

function Example(){const data=useRealRoutes();return <><RealSearch data={data} onCompare={()=>{}}/><output>{JSON.stringify(data.origin)}</output></>;}
afterEach(()=>{vi.unstubAllGlobals();delete navigator.geolocation;});

it('mostra a localização como alternativa dentro da seção de origem',()=>{
  render(<Example/>);
  const search=screen.getByLabelText('Origem').closest('.search-box');
  const location=screen.getByRole('button',{name:/usar minha localização atual/i});
  expect(search).toContainElement(location);
  expect(search).toContainElement(screen.getByText(/usada como origem e enviada ao provedor/i));
  expect(location.compareDocumentPosition(screen.getByLabelText('Destino')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('sugere endereços após digitar e descarta uma resposta antiga',async()=>{
  let finishOld;
  vi.stubGlobal('fetch',vi.fn(url=>url.includes('Paul')?new Promise(resolve=>{finishOld=resolve;}):Promise.resolve({ok:true,json:async()=>({places:[{label:'Avenida Paulista',coordinates:[-46.65,-23.56]}]})})));
  const user=userEvent.setup();render(<Example/>);
  await user.type(screen.getByLabelText('Origem'),'Paul');
  await waitFor(()=>expect(finishOld).toBeTypeOf('function'));
  await user.clear(screen.getByLabelText('Origem'));
  await user.type(screen.getByLabelText('Origem'),'Centro');
  finishOld({ok:true,json:async()=>({places:[{label:'Resposta antiga',coordinates:[-46.6,-23.5]}]})});
  expect(screen.queryByRole('button',{name:'Resposta antiga'})).not.toBeInTheDocument();
  expect(await screen.findByRole('button',{name:'Avenida Paulista'})).toBeInTheDocument();
});

it('usa uma leitura autorizada como origem após validar o município',async()=>{
  const getCurrentPosition=vi.fn(success=>success({coords:{latitude:-23.55,longitude:-46.63}}));
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition}});
  const fetch=vi.fn(async()=>({ok:true,json:async()=>({valid:true})}));vi.stubGlobal('fetch',fetch);
  const user=userEvent.setup();render(<Example/>);
  expect(getCurrentPosition).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:/usar minha localização atual/i}));
  await waitFor(()=>expect(screen.getByLabelText('Origem')).toHaveValue('Minha localização atual'));
  expect(JSON.parse(fetch.mock.calls[0][1].body).coordinates).toEqual([-46.63,-23.55]);
  expect(screen.getByText(/"coordinates":\[-46.63,-23.55\]/)).toBeInTheDocument();
});

it('informa quando a permissão é negada e permite usar endereço manual',async()=>{
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(_success,fail)=>fail({code:1})}});
  const user=userEvent.setup();render(<Example/>);
  await user.click(screen.getByRole('button',{name:/usar minha localização atual/i}));
  expect(await screen.findByText(/permissão de localização foi negada/i)).toBeInTheDocument();
  await user.type(screen.getByLabelText('Origem'),'Paulista');
  expect(screen.getByLabelText('Origem')).toHaveValue('Paulista');
});

it('não seleciona uma posição fora do município',async()=>{
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:success=>success({coords:{latitude:-23.5,longitude:-46.9}})}});
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,json:async()=>({error:'A localização deve estar no município de São Paulo.'})})));
  const user=userEvent.setup();render(<Example/>);
  await user.click(screen.getByRole('button',{name:/usar minha localização atual/i}));
  expect(await screen.findByText(/localização deve estar no município/i)).toBeInTheDocument();
  expect(screen.getByText('null')).toBeInTheDocument();
});

it('não substitui a origem digitada quando uma leitura antiga chega depois',async()=>{
  let reply;
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:success=>{reply=success;}}});
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  const user=userEvent.setup();render(<Example/>);
  await user.click(screen.getByRole('button',{name:/usar minha localização atual/i}));
  await user.type(screen.getByLabelText('Origem'),'Paulista');
  reply({coords:{latitude:-23.55,longitude:-46.63}});
  expect(screen.getByLabelText('Origem')).toHaveValue('Paulista');
  expect(fetch).not.toHaveBeenCalled();
});

it('permite informar endereço quando o navegador não fornece localização',async()=>{
  delete navigator.geolocation;
  const user=userEvent.setup();render(<Example/>);
  await user.click(screen.getByRole('button',{name:/usar minha localização atual/i}));
  expect(screen.getByText(/localização indisponível neste navegador/i)).toBeInTheDocument();
});

it('informa indisponibilidade quando a busca recebe uma resposta inválida ou a rede falha',async()=>{
  const user=userEvent.setup();
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:false,json:async()=>{throw new SyntaxError('Unexpected end of JSON input');}}).mockRejectedValueOnce(new TypeError('Failed to fetch')));
  render(<Example/>);
  const origin=screen.getByLabelText('Origem');
  await user.type(origin,'Paulista');
  expect(await screen.findByText(/não foi possível consultar os dados/i)).toBeInTheDocument();
  await user.clear(origin);
  await user.type(origin,'Ibirapuera');
  expect(await screen.findByText(/não foi possível consultar os dados/i)).toBeInTheDocument();
  expect(screen.queryByText(/failed to fetch|unexpected end/i)).not.toBeInTheDocument();
});
