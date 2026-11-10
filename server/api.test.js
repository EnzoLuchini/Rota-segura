import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from './api.js';

test('busca sem chave informa indisponibilidade em vez de retornar dados simulados', async () => {
  const server = createServer({key:''});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/places?q=Paulista`);
    assert.equal(response.status,503);
    assert.match((await response.json()).error,/chave/i);
  } finally { server.close(); }
});

test('limita consulta de drenagem a uma área geográfica válida', async () => {
  const server = createServer({key:''});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/streams?bbox=0,0,180,80`);
    assert.equal(response.status,400);
  } finally { server.close(); }
});
