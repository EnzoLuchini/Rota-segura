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

it('carrega somente as rotas da conta e preserva as rotas do visitante',async()=>{
  const {findByText}=screen;
  localStorage.setItem(REAL_SAVED_ROUTES_KEY,JSON.stringify([{id:'guest',name:'Visitante'}]));
  const store={list:vi.fn().mockResolvedValue([{id:'account',name:'Conta'}]),save:vi.fn()};
  function Account(){const [routes]=useRealSavedRoutes({userId:'user-a',store});return <output>{routes.map(route=>route.name).join(',')}</output>;}
  render(<Account/>);
  expect(await findByText('Conta')).toBeInTheDocument();
  expect(screen.queryByText('Visitante')).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(REAL_SAVED_ROUTES_KEY))[0].name).toBe('Visitante');
});

it('não anuncia salvamento quando o servidor rejeita a gravação',async()=>{
  const store={list:vi.fn().mockResolvedValue([]),save:vi.fn().mockRejectedValue(new Error('offline'))};
  function Account(){const [routes,save,error]=useRealSavedRoutes({userId:'user-a',store});return <><button onClick={()=>save([{id:'1',name:'Casa'}])}>Salvar conta</button><output>{routes.map(r=>r.name).join(',')}</output>{error && <p role="alert">{error}</p>}</>;}
  render(<Account/>);
  await screen.findByText('Salvar conta');
  await vi.waitFor(()=>expect(store.list).toHaveBeenCalled());
  fireEvent.click(screen.getByText('Salvar conta'));
  expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível salvar/i);
  expect(screen.queryByText('Casa')).not.toBeInTheDocument();
});

it('não mostra rotas da conta anterior enquanto troca de usuário',async()=>{
  const store={list:vi.fn(id=>id==='user-a'?Promise.resolve([{id:'a',name:'Rota A'}]):new Promise(()=>{})),save:vi.fn()};
  function Account({userId}){const [routes]=useRealSavedRoutes({userId,store});return <output>{routes.map(route=>route.name).join(',')}</output>;}
  const view=render(<Account userId="user-a"/>);
  expect(await screen.findByText('Rota A')).toBeInTheDocument();
  view.rerender(<Account userId="user-b"/>);
  expect(screen.queryByText('Rota A')).not.toBeInTheDocument();
});

it('mantém dados locais separados ao sair da conta',async()=>{
  localStorage.setItem(REAL_SAVED_ROUTES_KEY,JSON.stringify([{id:'guest',name:'Visitante'}]));
  const store={list:vi.fn().mockResolvedValue([{id:'a',name:'Rota A'}]),save:vi.fn()};
  function Account({userId}){const [routes]=useRealSavedRoutes({userId,store});return <output>{routes.map(route=>route.name).join(',')}</output>;}
  const view=render(<Account userId="user-a"/>);
  expect(await screen.findByText('Rota A')).toBeInTheDocument();
  view.rerender(<Account userId={null}/>);
  expect(screen.getByText('Visitante')).toBeInTheDocument();
  expect(screen.queryByText('Rota A')).not.toBeInTheDocument();
});
