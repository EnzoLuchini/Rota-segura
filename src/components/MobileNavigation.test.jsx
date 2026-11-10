import React, {createRef} from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import MobileNavigation from './MobileNavigation';

function renderMenu(props = {}) {
  const triggerRef = createRef();
  const onClose = vi.fn();
  const onNavigate = vi.fn();

  render(
    <>
      <button ref={triggerRef}>Abrir menu</button>
      <main id="main-content">
        <h1 tabIndex={-1}>Mapa principal</h1>
      </main>
      <MobileNavigation
        open
        alertCount={1}
        onClose={onClose}
        onNavigate={onNavigate}
        triggerRef={triggerRef}
        {...props}
      />
    </>,
  );

  return {onClose, onNavigate, triggerRef};
}

describe('MobileNavigation', () => {
  it('não renderiza a navegação quando está fechado', () => {
    render(<MobileNavigation open={false} onClose={vi.fn()} onNavigate={vi.fn()} alertCount={0} triggerRef={createRef()}/>);
    expect(screen.queryByRole('navigation', {name: 'Navegação móvel'})).not.toBeInTheDocument();
  });

  it('leva o foco para a primeira ação ao abrir', async () => {
    renderMenu();
    await waitFor(() => expect(screen.getByRole('button', {name: 'Mapa'})).toHaveFocus());
  });

  it('fecha com Escape e devolve o foco ao gatilho', async () => {
    const {onClose, triggerRef} = renderMenu();
    await waitFor(() => expect(screen.getByRole('button', {name: 'Mapa'})).toHaveFocus());

    fireEvent.keyDown(document, {key: 'Escape'});

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(triggerRef.current).toHaveFocus());
  });

  it('fecha ao navegar para a tela atual e leva o foco ao título', async () => {
    const user = userEvent.setup();
    const {onClose, onNavigate} = renderMenu();

    await user.click(screen.getByRole('button', {name: 'Mapa'}));

    expect(onNavigate).toHaveBeenCalledWith('home');
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole('heading', {name: 'Mapa principal'})).toHaveFocus());
  });
});
