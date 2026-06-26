import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone } from './phone.js';

test('normalizes common phone formats to digits', () => {
  assert.equal(normalizePhone('+91 98765 43210'), '919876543210');
  assert.equal(normalizePhone('98765-43210'), '9876543210');
  assert.equal(normalizePhone('  +1 (555) 123-4567  '), '15551234567');
});

test('returns null for empty or invalid phone values', () => {
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone(undefined), null);
  assert.equal(normalizePhone('   '), null);
});
