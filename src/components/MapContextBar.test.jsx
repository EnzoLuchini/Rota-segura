import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import MapContextBar from './MapContextBar';

describe('MapContextBar', () => {
  it('mantém a legenda textual disponível', () => {
    render(<MapContextBar origin="Minha localização" destination="Hospital das Clínicas" onAnnounce={() => {}}/>);

    expect(screen.getByText('Menor exposição')).toBeInTheDocument();
    expect(screen.getByText('Outra rota')).toBeInTheDocument();
    expect(screen.getByText('Área de risco')).toBeInTheDocument();
  });

  it('expande e recolhe os pontos do mapa', async () => {
    const user = userEvent.setup();
    render(<MapContextBar origin="Minha localização" destination="Hospital das Clínicas" onAnnounce={() => {}}/>);

    const toggle = screen.getByRole('button', {name: 'Pontos do mapa'});
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', {name: 'Pontos importantes do mapa'})).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', {name: 'Pontos importantes do mapa'})).toBeInTheDocument();
    for (const label of ['Área R3', 'Ocorrência', 'Origem', 'Destino']) {
      expect(screen.getByRole('button', {name: label})).toBeInTheDocument();
    }

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', {name: 'Pontos importantes do mapa'})).not.toBeInTheDocument();
  });

  it('anuncia a origem e o destino atuais', async () => {
    const user = userEvent.setup();
    const onAnnounce = vi.fn();
    render(<MapContextBar origin="Casa" destination="Trabalho" onAnnounce={onAnnounce}/>);

    await user.click(screen.getByRole('button', {name: 'Pontos do mapa'}));
    await user.click(screen.getByRole('button', {name: 'Origem'}));
    await user.click(screen.getByRole('button', {name: 'Destino'}));

    expect(onAnnounce).toHaveBeenNthCalledWith(1, 'Origem demonstrativa: Casa.');
    expect(onAnnounce).toHaveBeenNthCalledWith(2, 'Destino demonstrativo: Trabalho.');
  });
});
