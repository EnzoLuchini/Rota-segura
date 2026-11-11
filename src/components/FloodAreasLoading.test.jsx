import React from 'react';
import {act,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
const fixture=vi.hoisted(()=>({events:null,images:[],offset:0,map:{getBounds(){const west=-46.7+fixture.offset,east=-46.6+fixture.offset,south=-23.6,north=-23.5;const bounds=(w,s,e,n)=>({getWest:()=>w,getSouth:()=>s,getEast:()=>e,getNorth:()=>n,getSouthWest:()=>({lng:w,lat:s}),getNorthEast:()=>({lng:e,lat:n}),pad:amount=>bounds(w-(e-w)*amount,s-(n-s)*amount,e+(e-w)*amount,n+(n-s)*amount)});return bounds(west,south,east,north);},getZoom:()=>16,getSize:()=>({x:900,y:600}),options:{crs:{project:({lng,lat})=>({x:lng*1000,y:lat*1000})}}}}));
vi.mock('react-leaflet',()=>({ImageOverlay:({url})=><div data-testid="flood-image">{url}</div>,GeoJSON:()=>null,Polyline:()=>null,Circle:()=>null,Marker:()=>null,Popup:()=>null,useMap:()=>fixture.map,useMapEvents:events=>{fixture.events=events;return fixture.map;}}));
import {FloodAreas} from './RealLayers';

afterEach(()=>{vi.unstubAllGlobals();fixture.images.length=0;fixture.offset=0;});
it('solicita uma imagem oficial para toda a área e informa falhas',()=>{
  class FakeImage{constructor(){fixture.images.push(this);} set src(value){this.url=value;}}
  vi.stubGlobal('Image',FakeImage);
  render(<><div id="flood-status"/><FloodAreas period={5}/></>);
  const url=new URL(fixture.images[0].url);
  expect(url.searchParams.get('layers')).toBe('geoportal:mancha_inundacao_5');
  expect(url.searchParams.get('styles')).toBe('polygon');
  expect(url.searchParams.get('width')).toBe('1800');
  act(()=>fixture.images[0].onload());
  expect(screen.getByTestId('flood-image')).toBeInTheDocument();
  act(()=>{fixture.offset=0.02;fixture.events.moveend();});
  expect(fixture.images).toHaveLength(1);
  act(()=>{fixture.offset=0.2;fixture.events.moveend();fixture.images.at(-1).onerror();});
  expect(document.getElementById('flood-status')).toHaveTextContent(/manchas.*indisponíveis/i);
  act(()=>{fixture.offset=0;fixture.events.moveend();});
  expect(fixture.images).toHaveLength(2);
  expect(document.getElementById('flood-status')).toHaveTextContent('');
});
