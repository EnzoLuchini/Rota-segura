import React from 'react';
import {render, screen, cleanup} from '@testing-library/react';
import {afterEach, expect, it} from 'vitest';
import RealMapLegend from './RealMapLegend';

afterEach(cleanup);

it('explica as linhas e a área do mapa sem confundir seleção com segurança', () => {
  render(<RealMapLegend showRoutes showWater showRisk/>);
  const legend = screen.getByRole('region', {name:'Legenda do mapa'});
  expect(legend).toHaveTextContent('Trajeto selecionado');
  expect(legend).toHaveTextContent('Outras alternativas');
  expect(legend).toHaveTextContent('Rio ou córrego mapeado');
  expect(legend).toHaveTextContent('Trecho subterrâneo');
  expect(legend).toHaveTextContent('Área de risco mapeada');
  expect(legend).toHaveTextContent('GeoSampa');
});

it('não anuncia camadas desligadas nem trajetos ainda não consultados', () => {
  render(<RealMapLegend showRoutes={false} showWater={false} showRisk={false}/>);
  expect(screen.queryByText('Trajeto selecionado')).not.toBeInTheDocument();
  expect(screen.queryByText('Rio ou córrego mapeado')).not.toBeInTheDocument();
  expect(screen.queryByText('Área de risco mapeada')).not.toBeInTheDocument();
});
