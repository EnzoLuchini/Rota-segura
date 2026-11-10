import React from 'react';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import MapContextBar from './MapContextBar';

describe('MapContextBar', () => {
  it('mantém a legenda textual disponível', () => {
    render(<MapContextBar/>);

    expect(screen.getByText('Menor exposição')).toBeInTheDocument();
    expect(screen.getByText('Outra rota')).toBeInTheDocument();
    expect(screen.getByText('Área de risco')).toBeInTheDocument();
  });

  it('não exibe o dropdown de pontos do mapa', () => {
    render(<MapContextBar/>);

    expect(screen.queryByRole('button', {name: 'Pontos do mapa'})).not.toBeInTheDocument();
    expect(screen.queryByText('Área R3')).not.toBeInTheDocument();
    expect(screen.queryByText('Ocorrência')).not.toBeInTheDocument();
  });
});
