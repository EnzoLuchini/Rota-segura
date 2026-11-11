import React,{useState} from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import ExtraScreens from '../ExtraScreens';
import {useRealSavedRoutes,REAL_SAVED_ROUTES_KEY} from '../state/useRealSavedRoutes';

const origin={label:'Paulista',coordinates:[-46.65,-23.56]},destination={label:'Pinheiros',coordinates:[-46.70,-23.57]};
const useRoute=vi.fn();
function Example({initial='save'}){const [view,go]=useState(initial);const [routes,setRoutes,error]=useRealSavedRoutes();return <ExtraScreens view={view} go={go} real origin={origin} destination={destination} savedRoutes={routes} setSavedRoutes={setRoutes} savedRoutesError={error} onUseRoute={useRoute}/>;}
afterEach(()=>{cleanup();localStorage.removeItem(REAL_SAVED_ROUTES_KEY);vi.restoreAllMocks();useRoute.mockClear();});

it('salva pontos reais, edita e reutiliza após recarregar, sem rotas fictícias',async()=>{
  const user=userEvent.setup();
  const view=render(<Example/>);
  expect(screen.queryByRole('option',{name:'A pé'})).not.toBeInTheDocument();
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
