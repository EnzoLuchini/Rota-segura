import React from 'react';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import {usePushNotifications} from '../state/usePushNotifications';

function Example({routes}){const push=usePushNotifications(routes);return <><button onClick={push.activate}>Ativar</button><output>{push.status}</output><p>{push.message}</p></>;}
afterEach(()=>{localStorage.clear();vi.unstubAllGlobals();delete navigator.serviceWorker;});

it('solicita permissão e registra a inscrição antes de indicar sucesso',async()=>{
  const subscription={toJSON:()=>({endpoint:'https://fcm.googleapis.com/fcm/send/x',keys:{p256dh:'b'.repeat(87),auth:'c'.repeat(22)}})};
  const register=vi.fn(async()=>({pushManager:{getSubscription:async()=>null,subscribe:async()=>subscription}}));
  Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{register}});
  vi.stubGlobal('PushManager',function(){});
  const requestPermission=vi.fn(async()=>'granted');
  vi.stubGlobal('Notification',{permission:'granted',requestPermission});
  const fetch=vi.fn(async(url,options)=>url==='/api/push/config'?{ok:true,json:async()=>({available:true,publicKey:'AQ'})}:{ok:true,json:async()=>({ok:true})});
  vi.stubGlobal('fetch',fetch);
  const user=userEvent.setup();render(<Example routes={[]}/>);
  await waitFor(()=>expect(fetch).toHaveBeenCalledWith('/api/push/config'));
  await user.click(screen.getByRole('button',{name:'Ativar'}));
  await waitFor(()=>expect(screen.getByText('active')).toBeInTheDocument());
  expect(requestPermission).toHaveBeenCalledOnce();expect(register).toHaveBeenCalledWith('/push-sw.js');
  expect(fetch.mock.calls.some(([url,options])=>url==='/api/push/device' && options.method==='POST')).toBe(true);
});

it('não registra inscrição quando a permissão é negada',async()=>{
  const register=vi.fn();
  Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{register}});
  vi.stubGlobal('PushManager',function(){});
  vi.stubGlobal('Notification',{permission:'denied',requestPermission:vi.fn(async()=>'denied')});
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({available:true,publicKey:'AQ'})})));
  const user=userEvent.setup();render(<Example routes={[]}/>);
  await waitFor(()=>expect(fetch).toHaveBeenCalled());
  await user.click(screen.getByRole('button',{name:'Ativar'}));
  expect(await screen.findByText(/permissão para notificações não concedida/i)).toBeInTheDocument();
  expect(register).not.toHaveBeenCalled();
});
