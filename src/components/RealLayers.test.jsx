import React from 'react';
import {render} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
const map=vi.hoisted(()=>({fitBounds:vi.fn(),invalidateSize:vi.fn()}));
vi.mock('react-leaflet',()=>({GeoJSON:()=>null,useMap:()=>map,useMapEvents:()=>null}));
import {FitRoutes} from './RealLayers';

it('atualiza as dimensões antes de enquadrar a rota sem animação',()=>{
  render(<FitRoutes routes={[{geometry:{coordinates:[[-46.7,-23.6],[-46.6,-23.5]]}}]}/>);
  expect(map.fitBounds).toHaveBeenCalledWith([[-23.6,-46.7],[-23.5,-46.6]],{padding:[35,35],animate:false});
  expect(map.invalidateSize.mock.invocationCallOrder[0]).toBeLessThan(map.fitBounds.mock.invocationCallOrder[0]);
});
