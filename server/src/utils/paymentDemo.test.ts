import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDemoPaymentAmount } from './paymentDemo.js';

test('normalizes demo payments to a safe minimum and maximum', () => {
  assert.equal(normalizeDemoPaymentAmount(100), 5000);
  assert.equal(normalizeDemoPaymentAmount('25000'), 25000);
  assert.equal(normalizeDemoPaymentAmount(600000), 500000);
  assert.equal(normalizeDemoPaymentAmount(undefined), 5000);
});
