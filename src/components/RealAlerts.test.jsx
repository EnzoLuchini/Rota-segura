import React from 'react';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import RealAlerts from './RealAlerts';

const item={id:'1',event:'Tempestade',severity:'Moderate',headline:'Aviso de tempestade',description:'Chuva intensa <script>texto</script>',start:new Date(Date.now()-3600000).toISOString(),end:new Date(Date.now()+3600000).toISOString(),url:'https://avisos.inmet.gov.br/123',source:'INMET'};
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it('mostra aviso vigente com origem e limitação de cobertura, e abre detalhes em segurança',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({status:'partial',coverage:'unknown',checkedAt:'2026-11-11T18:00:00Z',alerts:[item]})}));
  const user=userEvent.setup();render(<RealAlerts onBack={()=>{}}/>);
  await user.click(await screen.findByRole('button',{name:/aviso de tempestade/i}));
  expect(screen.getByText(/consulta parcial/i)).toBeInTheDocument();
  expect(screen.getByText(/cobertura.*não.*confirmada/i)).toBeInTheDocument();
  expect(screen.getByText(/<script>texto<\/script>/i)).toBeInTheDocument();
  expect(screen.getByRole('link',{name:/abrir aviso oficial/i})).toHaveAttribute('href',item.url);
});

it('diferencia lista vazia de indisponibilidade',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({status:'available',coverage:'unknown',checkedAt:'2026-11-11T18:00:00Z',alerts:[]})}).mockRejectedValueOnce(Error('offline')));
  const first=render(<RealAlerts onBack={()=>{}}/>);
  expect(await screen.findByText(/nenhum aviso vigente encontrado entre os itens consultados/i)).toBeInTheDocument();
  first.unmount();render(<RealAlerts onBack={()=>{}}/>);
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent(/indisponíveis/i));
});

it('permite tentar novamente após falha da fonte',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce({ok:true,json:async()=>({status:'available',coverage:'unknown',checkedAt:'2026-11-11T18:00:00Z',alerts:[]})}));
  const user=userEvent.setup();render(<RealAlerts onBack={()=>{}}/>);
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:/tentar novamente/i}));
  expect(await screen.findByText(/nenhum aviso vigente encontrado entre os itens consultados/i)).toBeInTheDocument();
});
