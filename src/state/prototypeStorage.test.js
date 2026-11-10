import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  PROTOTYPE_STORAGE_KEYS,
  clearPrototypeStorage,
  createInitialPreferences,
  shouldShowScenarioAlert,
} from './prototypeStorage.js';

function createStorage(entries) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: key => values.get(key) ?? null,
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  };
}

test('limpeza remove somente os dados locais do protótipo', () => {
  const storage = createStorage({
    [PROTOTYPE_STORAGE_KEYS.savedRoutes]: '[{"id":"1"}]',
    [PROTOTYPE_STORAGE_KEYS.reports]: '[{"id":"2"}]',
    [PROTOTYPE_STORAGE_KEYS.preferences]: '{"alerts":false}',
    [PROTOTYPE_STORAGE_KEYS.profile]: '"Ana"',
    [PROTOTYPE_STORAGE_KEYS.readAlert]: 'true',
    'outro-aplicativo': 'preservar',
  });

  clearPrototypeStorage(storage);

  assert.deepEqual(storage.snapshot(), {'outro-aplicativo': 'preservar'});
});

test('preferências iniciais têm todos os controles exibidos no perfil', () => {
  assert.deepEqual(createInitialPreferences(), {
    alerts: true,
    rain: true,
    incidents: true,
    location: false,
    severity: 'Todas',
    quiet: '22:00',
  });
});

test('preferência geral de alertas controla o alerta do cenário', () => {
  assert.equal(shouldShowScenarioAlert({alerts: true}, true), true);
  assert.equal(shouldShowScenarioAlert({alerts: false}, true), false);
  assert.equal(shouldShowScenarioAlert({alerts: true}, false), false);
});

test('categoria e severidade mínima filtram o alerta alto do cenário', () => {
  assert.equal(shouldShowScenarioAlert({alerts: true, incidents: false, severity: 'Todas'}, true), false);
  assert.equal(shouldShowScenarioAlert({alerts: true, incidents: true, severity: 'Crítica'}, true), false);
  assert.equal(shouldShowScenarioAlert({alerts: true, incidents: true, severity: 'Alta'}, true), true);
});
