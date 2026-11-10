import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect, it, vi} from 'vitest';
import CityMapPanel from './CityMapPanel';

it('alterna entre ocorrências atuais e registros históricos e permite consultar detalhes', async () => {
  const user = userEvent.setup();
  const onModeChange = vi.fn();
  const {rerender} = render(<CityMapPanel mode="now" onModeChange={onModeChange} onBack={() => {}} />);
  expect(screen.getByText(/dados fictícios/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', {name: 'Histórico'}));
  expect(onModeChange).toHaveBeenCalledWith('history');
  rerender(<CityMapPanel mode="history" onModeChange={onModeChange} onBack={() => {}} />);
  expect(screen.getByText(/não significa que há alagamento agora/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', {name: /Pinheiros.*registros/i}));
  expect(screen.getByText(/período fictício/i)).toBeInTheDocument();
});

it('mantém os controles de simulação recolhidos até a pessoa solicitá-los', async () => {
  const user = userEvent.setup();
  const onDataStateChange = vi.fn();
  render(<CityMapPanel mode="now" onModeChange={() => {}} onBack={() => {}} onDataStateChange={onDataStateChange} />);
  expect(screen.queryByLabelText('Condição dos dados (simulação)')).not.toBeVisible();
  await user.click(screen.getByText('Opções de simulação'));
  await user.selectOptions(screen.getByLabelText('Condição dos dados (simulação)'), 'unavailable');
  expect(onDataStateChange).toHaveBeenCalledWith('unavailable');
});

it('apresenta exemplos históricos em diferentes regiões com detalhes fictícios', async () => {
  const user = userEvent.setup();
  render(<CityMapPanel mode="history" onModeChange={() => {}} onBack={() => {}} />);
  expect(screen.getAllByRole('button', {name: /registros/i}).length).toBeGreaterThanOrEqual(5);
  await user.click(screen.getByRole('button', {name: /Vila Mariana.*registros/i}));
  expect(screen.getByText(/inundação.*período fictício/i)).toBeInTheDocument();
});

it('mostra ocorrências recentes fictícias de alagamento e inundação', async () => {
  const user = userEvent.setup();
  render(<CityMapPanel mode="now" onModeChange={() => {}} onBack={() => {}} />);
  expect(screen.getAllByRole('button', {name: /alagamento|inundação/i}).length).toBeGreaterThanOrEqual(4);
  await user.click(screen.getByRole('button', {name: /inundação na Vila Mariana/i}));
  expect(screen.getByText(/via parcialmente interditada/i)).toBeInTheDocument();
});

it('mostra outros avisos fictícios com detalhes', async () => {
  const user = userEvent.setup();
  render(<CityMapPanel mode="now" onModeChange={() => {}} onBack={() => {}} />);
  await user.click(screen.getByRole('button', {name: /queda de árvore/i}));
  expect(screen.getByText(/galhos bloqueiam/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', {name: /via interditada/i}));
  expect(screen.getByText(/bloqueio preventivo/i)).toBeInTheDocument();
});

it('permite localizar um aviso da lista no mapa', async () => {
  const user = userEvent.setup();
  const onLocate = vi.fn();
  render(<CityMapPanel mode="now" onModeChange={() => {}} onBack={() => {}} onLocate={onLocate} />);
  await user.click(screen.getByRole('button', {name: 'Alagamento em Pinheiros'}));
  await user.click(screen.getByRole('button', {name: 'Ver Alagamento em Pinheiros no mapa'}));
  expect(onLocate).toHaveBeenCalledWith(expect.objectContaining({id: 'alagamento-1'}));
});
