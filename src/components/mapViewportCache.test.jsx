import {describe, expect, it} from 'vitest';
import {bufferBox, containsBox, findCoverage} from './mapViewportCache';

describe('área carregada ao redor do mapa', () => {
  it('cobre movimentos próximos sem ultrapassar os limites da API', () => {
    const box = bufferBox([-46.7, -23.6, -46.6, -23.5]);
    expect(containsBox(box, [-46.69, -23.6, -46.59, -23.5])).toBe(true);
    expect(containsBox(box, [-46.55, -23.6, -46.45, -23.5])).toBe(false);
    const wide = bufferBox([-46.8, -23.7, -46.51, -23.41]);
    expect(wide[2] - wide[0]).toBeLessThanOrEqual(0.3);
    expect(wide[3] - wide[1]).toBeLessThanOrEqual(0.3);
  });
  it('reutiliza apenas dados não expirados e compatíveis com o zoom', () => {
    const entry = {box: [-46.8,-23.7,-46.5,-23.4], zoom: 16, time: 100};
    const box = [-46.7,-23.6,-46.6,-23.5];
    expect(findCoverage([entry], box, 16, 150, 100)).toBe(entry);
    expect(findCoverage([entry], box, 17, 150, 100)).toBeUndefined();
    expect(findCoverage([entry], box, 16, 201, 100)).toBeUndefined();
  });
});
