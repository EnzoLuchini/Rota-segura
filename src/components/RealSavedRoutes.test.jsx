import React,{useState} from 'react';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import ExtraScreens from '../ExtraScreens';
import {useRealSavedRoutes,REAL_SAVED_ROUTES_KEY} from '../state/useRealSavedRoutes';

const origin={label:'Paulista',coordinates:[-46.65,-23.56]},destination={label:'Pinheiros',coordinates:[-46.70,-23.57]};
const useRoute=vi.fn();
function Example({initial='save',travelMode='driving'}){const [view,go]=useState(initial);const [routes,setRoutes,error]=useRealSavedRoutes();return <ExtraScreens view={view} go={go} real realTravelMode={travelMode} origin={origin} destination={destination} savedRoutes={routes} setSavedRoutes={setRoutes} savedRoutesError={error} onUseRoute={useRoute}/>;}
afterEach(()=>{cleanup();localStorage.removeItem(REAL_SAVED_ROUTES_KEY);vi.restoreAllMocks();vi.unstubAllGlobals();useRoute.mockClear();});

it('salva pontos reais, edita e reutiliza após recarregar, sem rotas fictícias',async()=>{
  const user=userEvent.setup();
  const view=render(<Example/>);
  expect(screen.getByLabelText('Modal')).toBeDisabled();
  expect(screen.getByLabelText('Modal')).toHaveValue('Carro');
  await user.clear(screen.getByLabelText('Nome da rota'));
  await user.type(screen.getByLabelText('Nome da rota'),'Trabalho');
  await user.click(screen.getByRole('button',{name:/salvar neste navegador/i}));
  expect(screen.getByText('Trabalho')).toBeInTheDocument();
  expect(screen.getByText(/Paulista.*Pinheiros/)).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/pausar alertas/i})).not.toBeInTheDocument();
  view.unmount();render(<Example initial="saved"/>);
  await user.click(screen.getByRole('button',{name:/editar/i}));
  await user.clear(screen.getByLabelText('Nome da rota'));
  await user.type(screen.getByLabelText('Nome da rota'),'Casa');
  await user.click(screen.getByRole('button',{name:/salvar neste navegador/i}));
  expect(screen.getByText('Casa')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:/consultar novamente/i}));
  expect(useRoute).toHaveBeenCalledWith(expect.objectContaining({origin,destination}));
  const confirm=vi.spyOn(window,'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  await user.click(screen.getByRole('button',{name:/excluir/i}));
  expect(screen.getByText('Casa')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:/excluir/i}));
  expect(screen.queryByText('Casa')).not.toBeInTheDocument();
  expect(confirm).toHaveBeenCalledTimes(2);
});

it('preserva o modo de caminhada ao salvar e consultar novamente',async()=>{
  const user=userEvent.setup();render(<Example travelMode="walking"/>);
  expect(screen.getByLabelText('Modal')).toHaveValue('A pé');
  await user.click(screen.getByRole('button',{name:/salvar neste navegador/i}));
  await user.click(screen.getByRole('button',{name:/consultar novamente/i}));
  expect(useRoute).toHaveBeenCalledWith(expect.objectContaining({mode:'A pé'}));
});

it('mostra horários e modal da rota salva',()=>{
 localStorage.setItem(REAL_SAVED_ROUTES_KEY,JSON.stringify([{id:'1',name:'Casa',origin,destination,mode:'A pé',days:'Todos os dias',outbound:'08:00',returnTime:'18:00'}]));
 render(<Example initial="saved"/>);
 expect(screen.getByText(/andando/i)).toBeInTheDocument();
 expect(screen.getByText(/ida 08:00.*volta 18:00/i)).toBeInTheDocument();
});

it('mostra avisos vigentes compatíveis com a rota cadastrada',async()=>{
 const geometry={type:'LineString',coordinates:[[-46.7,-23.56],[-46.65,-23.56]]};
 const polygon={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-46.72,-23.58],[-46.64,-23.58],[-46.64,-23.54],[-46.72,-23.54],[-46.72,-23.58]]]}};
 localStorage.setItem(REAL_SAVED_ROUTES_KEY,JSON.stringify([{id:'1',name:'Casa',origin,destination,geometry,mode:'Carro',days:'Todos os dias',outbound:'08:00',returnTime:'18:00'}]));
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({status:'partial',alerts:[{areas:[polygon],start:new Date(Date.now()-10000).toISOString(),end:new Date(Date.now()+60000).toISOString()}]})}));
 render(<Example initial="saved"/>);
 const card=screen.getByText('Casa').closest('.local-card');
 expect(await within(card).findByText(/1 aviso meteorológico vigente abrange esta rota/i)).toBeInTheDocument();
 expect(within(card).getByText(/consulta parcial/i)).toBeInTheDocument();
});

it('mantém o formulário aberto quando a conta não consegue salvar no servidor',async()=>{
 const user=userEvent.setup(),go=vi.fn(),save=vi.fn().mockResolvedValue(false);
 render(<ExtraScreens view="save" go={go} real origin={origin} destination={destination} savedRoutes={[]} setSavedRoutes={save} savedRoutesState={{account:true,loading:false}}/>);
 await user.click(screen.getByRole('button',{name:'Salvar na conta'}));
 expect(save).toHaveBeenCalledOnce();
 expect(go).not.toHaveBeenCalled();
 expect(screen.getByRole('button',{name:'Salvar na conta'})).toBeInTheDocument();
});
