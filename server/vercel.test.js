import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

test('a função Vercel encaminha GET e POST para a API existente', async () => {
  const {default: handler} = await import('../api/[...path].js');
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const get = await fetch(`${base}/api/places?q=ab`);
    assert.equal(get.status, 400);
    assert.match((await get.json()).error, /endereço/);
    const post = await fetch(`${base}/api/location`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({coordinates:[0,0]})});
    assert.equal(post.status, 400);
    assert.match((await post.json()).error, /localização/i);
  } finally { server.close(); }
});
