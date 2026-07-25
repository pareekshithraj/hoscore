import assert from 'assert';
import { pick } from '../utils/pick.js';

export function runHardeningTests() {
  // Test 1: Pick helper strips un-allowed fields like hospitalId and userId
  const maliciousBody = {
    name: 'John Doe',
    hospitalId: 'attacker-hospital-id',
    userId: 'attacker-user-id',
    sixDigitId: '999999',
    isHoscoreUser: false,
    contact: '+919876543210',
  };

  const safeData = pick(maliciousBody, ['name', 'contact']);
  assert.strictEqual(safeData.name, 'John Doe');
  assert.strictEqual(safeData.contact, '+919876543210');
  assert.strictEqual((safeData as any).hospitalId, undefined);
  assert.strictEqual((safeData as any).userId, undefined);

  // Test 2: Hospital update pick helper strips administrative fields
  const adminUpdatePayload = {
    name: 'Apollo City Hospital',
    isPartnered: false,
    isActive: false,
    rating: 5,
    slug: 'hacked-slug',
    city: 'Bangalore',
  };

  const safeHospitalData = pick(adminUpdatePayload, ['name', 'city']);
  assert.strictEqual(safeHospitalData.name, 'Apollo City Hospital');
  assert.strictEqual(safeHospitalData.city, 'Bangalore');
  assert.strictEqual((safeHospitalData as any).isPartnered, undefined);
  assert.strictEqual((safeHospitalData as any).isActive, undefined);

  console.log('✅ All HOSCORE hardening unit tests passed successfully!');
}
