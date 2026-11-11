import React from 'react';
import {render,screen,waitFor,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
vi.mock('react-leaflet',()=>({Marker:({children})=><div>{children}</div>,Popup:({children})=><div>{children}</div>}));
import RainLayer from './RainLayer';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it('mostra estação e indica medição antiga, depois limpa ao desativar',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({stations:[{id:'1',name:'Estação A',coordinates:[-46.7,-23.5],value:0,start:'2026-11-11T14:20:00Z',end:'2026-11-11T15:00:00Z',stale:true,owner:'SP Águas'}]})}));
  const {rerender}=render(<><p id="rain-status"/><RainLayer enabled/></>);
  expect(await screen.findByText('Estação A')).toBeInTheDocument();
  expect(screen.getByText(/medição antiga/i)).toBeInTheDocument();
  expect(screen.getByText(/0 mm/)).toBeInTheDocument();
  rerender(<><p id="rain-status"/><RainLayer enabled={false}/></>);
  expect(screen.queryByText('Estação A')).not.toBeInTheDocument();
});

it('informa falha da fonte sem apresentar ausência de chuva',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  render(<><p id="rain-status"/><RainLayer enabled/></>);
  await waitFor(()=>expect(screen.getByText(/chuva observada indisponível/i)).toBeInTheDocument());
});

it('informa ausência de medições válidas',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({stations:[]})}));
  render(<><p id="rain-status"/><RainLayer enabled/></>);
  await waitFor(()=>expect(screen.getByText(/nenhuma medição válida/i)).toBeInTheDocument());
});

it('informa que registros inválidos deixam a consulta parcial',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({partial:true,stations:[{id:'1',name:'Estação A',coordinates:[-46.7,-23.5],value:1,start:'2026-11-11T14:20:00Z',end:'2026-11-11T15:00:00Z'}]})}));
  render(<><p id="rain-status"/><RainLayer enabled/></>);
  await waitFor(()=>expect(screen.getByText(/medições parciais/i)).toBeInTheDocument());
});
