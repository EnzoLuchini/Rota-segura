import React from 'react';
import {render} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import MapResizeObserver from './MapResizeObserver';

const map=vi.hoisted(()=>({getContainer:vi.fn(),invalidateSize:vi.fn()}));
vi.mock('react-leaflet',()=>({useMap:()=>map}));
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});

it('atualiza o Leaflet quando a área do mapa muda de tamanho',()=>{
  const container=document.createElement('div');map.getContainer.mockReturnValue(container);
  let notify;
  const disconnect=vi.fn();
  vi.stubGlobal('ResizeObserver',class{constructor(callback){notify=callback;}observe=vi.fn();disconnect=disconnect;});
  vi.stubGlobal('requestAnimationFrame',callback=>{callback();return 1;});
  vi.stubGlobal('cancelAnimationFrame',vi.fn());
  const view=render(<MapResizeObserver/>);
  notify();
  expect(map.invalidateSize).toHaveBeenCalledWith({animate:false,pan:false});
  view.unmount();
  expect(disconnect).toHaveBeenCalled();
});
