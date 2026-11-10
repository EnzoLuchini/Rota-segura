import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {retainEditIdForView} from './routeEditing.js';

test('sair do formulário encerra o contexto de edição', () => {
  assert.equal(retainEditIdForView('save', 'rota-1'), 'rota-1');
  assert.equal(retainEditIdForView('home', 'rota-1'), null);
  assert.equal(retainEditIdForView('compare', 'rota-1'), null);
});
