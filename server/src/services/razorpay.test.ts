import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldUseMockRazorpay } from './razorpay.js';

test('uses the mock checkout path for missing or invalid Razorpay credentials', () => {
  assert.equal(shouldUseMockRazorpay(undefined, { keyId: '', secret: '' }), true);
  assert.equal(shouldUseMockRazorpay({ statusCode: 401, error: { description: 'Authentication failed' } }, { keyId: 'rzp_test_123', secret: 'secret' }), true);
  assert.equal(shouldUseMockRazorpay({ statusCode: 400, error: { description: 'Bad request' } }, { keyId: 'rzp_test_123', secret: 'secret' }), false);
});
