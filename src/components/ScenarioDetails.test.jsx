import React from 'react';
import {render, screen, within} from '@testing-library/react';
import {it, expect, vi, afterEach} from 'vitest';
import userEvent from '@testing-library/user-event';
vi.mock('react-leaflet', () => ({MapContainer:({children})=><div>{children}</div>, TileLayer:()=>null, Polyline:()=>null, Polygon:()=>null, GeoJSON:()=>null, CircleMarker:({children})=><div>{children}</div>, Marker:()=>null, Popup:({children})=><div>{children}</div>, useMap:()=>({invalidateSize:()=>{},fitBounds:()=>{},setView:()=>{}}), useMapEvents:()=>null}));
import App from '../main';

afterEach(()=>{window.history.replaceState({}, '', '/'); vi.restoreAllMocks();});

it('explica a fonte, período fictício e relação do fator com a alternativa', async()=>{
  window.history.replaceState({}, '', '/simulacao?view=explain');
  const user=userEvent.setup();
  render(<App/>);
  const factor=screen.getByRole('button',{name:/histórico de alagamentos/i});
  await user.click(factor);
  expect(factor).toHaveAttribute('aria-expanded','true');
  expect(within(factor).getByText(/2023 a 2025.*fictício/i)).toBeInTheDocument();
  expect(within(factor).getByText(/alternativa mais rápida/i)).toBeInTheDocument();
  expect(within(factor).getByText(/GeoSampa/i)).toBeInTheDocument();
});

it('mostra origem e período do trecho selecionado e preserva a falta de cobertura', async()=>{
  window.history.replaceState({}, '', '/simulacao?view=segments');
  const user=userEvent.setup();
  render(<App/>);
  expect(screen.getByText(/período não disponível/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:/área de risco e ocorrência/i}));
  expect(screen.getByText(/há 6 min.*fictício/i)).toBeInTheDocument();
  expect(screen.getByText(/GeoSampa e relatos/i)).toBeInTheDocument();
  expect(screen.getByText(/alternativa mais rápida cruza a área e o ponto reportado/i)).toBeInTheDocument();
});
