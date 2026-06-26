import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVerifyAccessTokenPayload } from './msg91.js';

test('builds the MSG91 widget verification payload with the auth key and access token', () => {
  const payload = buildVerifyAccessTokenPayload('demo-access-token', 'demo-authkey');

  assert.deepEqual(payload, {
    authkey: 'demo-authkey',
    'access-token': 'demo-access-token',
  });
});
