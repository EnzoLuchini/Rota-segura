import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validSubscription} from './pushValidation.js';

test('aceita somente endpoints HTTPS conhecidos para entrega de push',()=>{
  const keys={p256dh:'a'.repeat(87),auth:'b'.repeat(22)};
  assert.equal(validSubscription({endpoint:'https://fcm.googleapis.com/fcm/send/example',keys}),true);
  assert.equal(validSubscription({endpoint:'http://fcm.googleapis.com/fcm/send/example',keys}),false);
  assert.equal(validSubscription({endpoint:'https://fcm.googleapis.com.evil.example/x',keys}),false);
  assert.equal(validSubscription({endpoint:'https://localhost/private',keys}),false);
});
