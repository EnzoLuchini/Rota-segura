import React from 'react';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import {RealSearch,useRealRoutes} from './RealRoutes';

function Example(){const data=useRealRoutes();return <><RealSearch data={data} onCompare={()=>{}}/><output>{JSON.stringify(data.origin)}</output></>;}
afterEach(()=>{vi.unstubAllGlobals();delete navigator.geolocation;});

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
