import React from 'react';
import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, expect, it, vi} from 'vitest';
import ExtraScreens from '../ExtraScreens';
import {useStoredState} from '../state/useStoredState';

const key = 'test-saved-routes';
const routes = [
  {id: 'one', name: 'Rota de teste', days: 'Todos os dias', returnTime: '18:00', enabled: true},
  {id: 'two', name: 'Outra rota', days: 'Todos os dias', returnTime: '18:00', enabled: true},
];

function SavedRoutes() {
  const [savedRoutes, setSavedRoutes] = useStoredState(key, routes);
  return <ExtraScreens view="saved" go={() => {}} savedRoutes={savedRoutes} setSavedRoutes={setSavedRoutes} />;
}

afterEach(() => {
  cleanup();
  localStorage.removeItem(key);
  vi.restoreAllMocks();
});

it('preserva a rota ao cancelar e remove somente a selecionada ao confirmar, inclusive após recarregar', async () => {
  const user = userEvent.setup();
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  const view = render(<SavedRoutes />);
  await user.click(screen.getAllByRole('button', {name: /excluir/i})[0]);
  expect(screen.getByText('Rota de teste')).toBeInTheDocument();
  await user.click(screen.getAllByRole('button', {name: /excluir/i})[0]);
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(screen.queryByText('Rota de teste')).not.toBeInTheDocument();
  expect(screen.getByText('Outra rota')).toBeInTheDocument();
  view.unmount();
  render(<SavedRoutes />);
  expect(screen.queryByText('Rota de teste')).not.toBeInTheDocument();
  expect(screen.getByText('Outra rota')).toBeInTheDocument();
});
