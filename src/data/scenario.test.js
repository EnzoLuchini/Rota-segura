import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  routes,
  occurrences,
  routeFactors,
  segments,
  canCompareTrip,
  validateTrip,
  saveRoute,
} from './scenario.js';

test('as alternativas e a ocorrência pertencem ao mesmo cenário', () => {
  assert.equal(routes.safe.minutes, 24);
  assert.equal(routes.fast.minutes, 18);
  assert.equal(routes.fast.occurrenceId, occurrences[0].id);
});

test('busca aceita apenas origem e destino do cenário', () => {
  assert.equal(validateTrip('Minha localização', 'Hospital das Clínicas'), true);
  assert.equal(validateTrip('Hospital das Clínicas', 'Minha localização'), true);
  assert.equal(validateTrip('Minha localização', 'Minha localização'), false);
  assert.equal(validateTrip('Rua inexistente', 'Hospital das Clínicas'), false);
});

test('salvar e editar rota preserva uma única entrada', () => {
  const initial = saveRoute([], { id: '1', name: 'Casa', routeId: 'safe' });
  const edited = saveRoute(initial, { id: '1', name: 'Trabalho', routeId: 'safe' });
  assert.equal(edited.length, 1);
  assert.equal(edited[0].name, 'Trabalho');
});

test('fatores e trechos reutilizam os identificadores do cenário', () => {
  assert.equal(routeFactors.find(factor => factor.id === 'historico')?.routeId, routes.fast.id);
  assert.equal(routeFactors.find(factor => factor.id === 'historico')?.occurrenceId, occurrences[0].id);
  assert.equal(segments.find(segment => segment.id === 'risco-e-ocorrencia')?.routeId, routes.fast.id);
  assert.equal(segments.find(segment => segment.id === 'risco-e-ocorrencia')?.occurrenceId, occurrences[0].id);
});

test('comparação exige viagem válida e dados disponíveis', () => {
  assert.equal(canCompareTrip('Minha localização', 'Hospital das Clínicas', 'available'), true);
  assert.equal(canCompareTrip('Rua inexistente', 'Hospital das Clínicas', 'available'), false);
  assert.equal(canCompareTrip('Minha localização', 'Hospital das Clínicas', 'unavailable'), false);
  assert.equal(canCompareTrip('Minha localização', 'Hospital das Clínicas', 'loading'), false);
});
