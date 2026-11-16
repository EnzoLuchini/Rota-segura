import React from 'react';
import {render} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {RouteCamera} from './RouteCamera';

const map=vi.hoisted(()=>({invalidateSize:vi.fn(),flyToBounds:vi.fn(),flyTo:vi.fn(),panTo:vi.fn(),getZoom:vi.fn(()=>16)}));
vi.mock('react-leaflet',()=>({useMap:()=>map,CircleMarker:({children})=><div>{children}</div>,Popup:({children})=><div>{children}</div>}));
afterEach(()=>{vi.clearAllMocks();vi.unstubAllGlobals();document.querySelector('.workspace')?.remove();});
const routes=[{geometry:{coordinates:[[-46.7,-23.6],[-46.69,-23.59]]}},{geometry:{coordinates:[[-46.7,-23.6],[-46.68,-23.58]]}}];

it('anima o enquadramento da alternativa selecionada',()=>{
 const {rerender}=render(<RouteCamera view="compare" routes={routes} selected={0}/>);
 expect(map.flyToBounds).toHaveBeenLastCalledWith([[-23.6,-46.7],[-23.59,-46.69]],expect.objectContaining({animate:true}));
 rerender(<RouteCamera view="compare" routes={routes} selected={1}/>);
 expect(map.flyToBounds).toHaveBeenLastCalledWith([[-23.6,-46.7],[-23.58,-46.68]],expect.objectContaining({animate:true}));
});

it('aproxima ao obter a primeira posição e acompanha as seguintes sem repetir o zoom',()=>{
 const {rerender}=render(<RouteCamera view="navigate" routes={routes} selected={0} position={{latitude:-23.55,longitude:-46.63}}/>);
 expect(map.flyTo).toHaveBeenCalledWith([-23.55,-46.63],16,expect.objectContaining({animate:true}));
 rerender(<RouteCamera view="navigate" routes={routes} selected={0} position={{latitude:-23.56,longitude:-46.64}}/>);
 expect(map.flyTo).toHaveBeenCalledTimes(1);
 expect(map.panTo).toHaveBeenCalledWith([-23.56,-46.64],expect.objectContaining({animate:true}));
});

it('reserva espaço para o painel inferior no enquadramento móvel',()=>{
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true})));
 const workspace=document.createElement('div');workspace.className='workspace';workspace.innerHTML='<aside class="panel"></aside>';document.body.append(workspace);
 workspace.querySelector('.panel').getBoundingClientRect=()=>({height:400});
 map.getSize=()=>({y:800});
 render(<RouteCamera view="compare" routes={routes} selected={0}/>);
 expect(map.flyToBounds).toHaveBeenCalledWith(expect.any(Array),expect.objectContaining({paddingBottomRight:[35,435]}));
});

it('desloca o centro da posição para mantê-la acima do painel móvel',()=>{
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true})));
 const workspace=document.createElement('div');workspace.className='workspace';workspace.innerHTML='<aside class="panel"></aside>';document.body.append(workspace);
 workspace.querySelector('.panel').getBoundingClientRect=()=>({height:400});
 map.getSize=()=>({y:800});
 map.project=vi.fn(()=>({add:offset=>offset}));
 map.unproject=vi.fn(()=>[-23.57,-46.63]);
 render(<RouteCamera view="navigate" routes={routes} position={{latitude:-23.55,longitude:-46.63}}/>);
 expect(map.unproject).toHaveBeenCalledWith([0,200],16);
 expect(map.flyTo).toHaveBeenCalledWith([-23.57,-46.63],16,expect.objectContaining({animate:true}));
});

it('faz nova aproximação ao reiniciar o acompanhamento',()=>{
 const position={latitude:-23.55,longitude:-46.63};
 const {rerender}=render(<RouteCamera view="navigate" routes={routes} position={position}/>);
 rerender(<RouteCamera view="compare" routes={routes} selected={0}/>);
 rerender(<RouteCamera view="navigate" routes={routes} position={position}/>);
 expect(map.flyTo).toHaveBeenCalledTimes(2);
});
