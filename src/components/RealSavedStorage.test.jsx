import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {useRealSavedRoutes,REAL_SAVED_ROUTES_KEY} from '../state/useRealSavedRoutes';

function Example(){
  const [routes,save,error]=useRealSavedRoutes();
  return <><button onClick={()=>save([{id:'1',name:'Trabalho'}])}>Salvar</button><output>{routes.map(route=>route.name).join(',')}</output>{error && <p role="alert">{error}</p>}</>;
}
afterEach(()=>{cleanup();localStorage.removeItem(REAL_SAVED_ROUTES_KEY);vi.restoreAllMocks();});

it('persiste separado da simulação e recupera após recarregar',()=>{
  localStorage.setItem('rota-salvas','[{"name":"Simulada"}]');
  const view=render(<Example/>);
  expect(screen.queryByText('Simulada')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Salvar'));
  view.unmount();render(<Example/>);
  expect(screen.getByText('Trabalho')).toBeInTheDocument();
  expect(localStorage.getItem('rota-salvas')).toContain('Simulada');
  localStorage.removeItem('rota-salvas');
});

it('informa erro e não anuncia salvamento quando o navegador bloqueia gravação',()=>{
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('bloqueado');});
  render(<Example/>);fireEvent.click(screen.getByText('Salvar'));
  expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível salvar/i);
  expect(screen.queryByText('Trabalho')).not.toBeInTheDocument();
});

it('não substitui dados existentes quando não consegue lê-los',()=>{
  localStorage.setItem(REAL_SAVED_ROUTES_KEY,'{inválido');
  render(<Example/>);
  expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível ler/i);
  fireEvent.click(screen.getByText('Salvar'));
  expect(localStorage.getItem(REAL_SAVED_ROUTES_KEY)).toBe('{inválido');
});
