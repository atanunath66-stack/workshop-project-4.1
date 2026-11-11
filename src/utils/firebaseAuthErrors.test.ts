import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatE164PhoneNumber,
  getFirebaseAuthErrorMessage,
} from './firebaseAuthErrors';

test('formatE164PhoneNumber: formats 10-digit Indian numbers with +91', () => {
  const res = formatE164PhoneNumber('9845012345');
  assert.equal(res.isValid, true);
  assert.equal(res.formatted, '+919845012345');
});

test('formatE164PhoneNumber: cleans whitespace and hyphens', () => {
  const res = formatE164PhoneNumber(' 98450-12345 ');
  assert.equal(res.isValid, true);
  assert.equal(res.formatted, '+919845012345');
});

test('formatE164PhoneNumber: handles leading 0 (trunk prefix)', () => {
  const res = formatE164PhoneNumber('09845012345');
  assert.equal(res.isValid, true);
  assert.equal(res.formatted, '+919845012345');
});

test('formatE164PhoneNumber: keeps valid pre-formatted +91 number', () => {
  const res = formatE164PhoneNumber('+919845012345');
  assert.equal(res.isValid, true);
  assert.equal(res.formatted, '+919845012345');
});

test('formatE164PhoneNumber: rejects invalid short numbers', () => {
  const res = formatE164PhoneNumber('12345');
  assert.equal(res.isValid, false);
  assert.ok(res.error);
});

test('getFirebaseAuthErrorMessage: correctly maps auth/operation-not-allowed', () => {
  const err = getFirebaseAuthErrorMessage({ code: 'auth/operation-not-allowed' });
  assert.equal(err.code, 'auth/operation-not-allowed');
  assert.ok(err.message.includes('Phone Authentication is not enabled'));
  assert.ok(err.actionRequired?.includes('Firebase Console'));
});

test('getFirebaseAuthErrorMessage: correctly maps auth/quota-exceeded', () => {
  const err = getFirebaseAuthErrorMessage({ code: 'auth/quota-exceeded' });
  assert.equal(err.code, 'auth/quota-exceeded');
  assert.ok(err.message.includes('quota'));
});

test('getFirebaseAuthErrorMessage: correctly maps auth/invalid-phone-number', () => {
  const err = getFirebaseAuthErrorMessage({ code: 'auth/invalid-phone-number' });
  assert.equal(err.code, 'auth/invalid-phone-number');
  assert.ok(err.message.includes('invalid'));
});
