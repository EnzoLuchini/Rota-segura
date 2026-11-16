import React from 'react';
import {render,screen} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
vi.mock('react-leaflet',()=>({MapContainer:({children})=><div>{children}</div>,TileLayer:()=>null,Polyline:()=>null,Polygon:()=>null,GeoJSON:()=>null,CircleMarker:()=>null,Marker:()=>null,Popup:()=>null,useMap:()=>({invalidateSize:()=>{},fitBounds:()=>{},setView:()=>{}}),useMapEvents:()=>null}));
vi.mock('../state/useAuth',()=>({useAuth:()=>({configured:true,recovering:true,user:{email:'pessoa@example.com'}})}));
import App from '../main';
it('abre o formulário de nova senha ao receber evento de recuperação',async()=>{
 render(<App real/>);
 expect(await screen.findByRole('heading',{name:'Definir nova senha'})).toBeInTheDocument();
 expect(screen.getByLabelText('Nova senha')).toBeInTheDocument();
});
