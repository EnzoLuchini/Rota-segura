import React from 'react';
import {act,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
const fixture=vi.hoisted(()=>({events:null,images:[],map:{getBounds(){return {getSouthWest:()=>({lng:-46.7,lat:-23.6}),getNorthEast:()=>({lng:-46.6,lat:-23.5})};},getSize:()=>({x:900,y:600}),options:{crs:{project:({lng,lat})=>({x:lng*1000,y:lat*1000})}}}}));
vi.mock('react-leaflet',()=>({ImageOverlay:({url})=><div data-testid="flood-image">{url}</div>,GeoJSON:()=>null,Polyline:()=>null,Circle:()=>null,Marker:()=>null,Popup:()=>null,useMap:()=>fixture.map,useMapEvents:events=>{fixture.events=events;return fixture.map;}}));
import {FloodAreas} from './RealLayers';

afterEach(()=>{vi.unstubAllGlobals();fixture.images.length=0;});
it('solicita uma imagem oficial para toda a área e informa falhas',()=>{
  class FakeImage{constructor(){fixture.images.push(this);} set src(value){this.url=value;}}
  vi.stubGlobal('Image',FakeImage);
  render(<><div id="flood-status"/><FloodAreas period={5}/></>);
  const url=new URL(fixture.images[0].url);
  expect(url.searchParams.get('layers')).toBe('geoportal:mancha_inundacao_5');
  expect(url.searchParams.get('styles')).toBe('polygon');
  expect(url.searchParams.get('width')).toBe('900');
  act(()=>fixture.images[0].onload());
  expect(screen.getByTestId('flood-image')).toBeInTheDocument();
  act(()=>{fixture.events.moveend();fixture.images.at(-1).onerror();});
  expect(document.getElementById('flood-status')).toHaveTextContent(/manchas.*indisponíveis/i);
});
