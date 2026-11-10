import {expect, it} from 'vitest';
import {cityEvents, getCityEvents} from '../data/cityMap';
import {getOrderedSegments} from '../data/scenario';

it('inclui relatos locais somente nos avisos atuais e identifica sua origem', () => {
  const report = {id: '123', type: 'Árvore caída', severity: 'Alta', passable: 'Não', description: 'Rua obstruída'};
  const events = getCityEvents('now', [report]);
  const local = events.find(event => event.id === 'report-123');
  expect(local).toMatchObject({kind: 'tree', title: 'Árvore caída · relato local', source: expect.stringMatching(/comunitário.*não.*oficial/i)});
  expect(local.detail).toContain('Rua obstruída');
  expect(getCityEvents('history', [report])).toEqual(cityEvents.history);
});

it('inverte a ordem dos trechos para a viagem de volta', () => {
  expect(getOrderedSegments(false).map(item => item.id)).toEqual(['origem-e-acesso', 'risco-e-ocorrencia', 'chegada']);
  expect(getOrderedSegments(true).map(item => item.id)).toEqual(['chegada', 'risco-e-ocorrencia', 'origem-e-acesso']);
});
