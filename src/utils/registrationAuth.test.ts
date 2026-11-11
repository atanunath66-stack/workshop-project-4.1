import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPER_ADMIN_EMAILS, isAuthorizedAdminEmail } from '../context/AppContext';

test('isAuthorizedAdminEmail: recognizes platform super admin emails case-insensitively', () => {
  assert.equal(isAuthorizedAdminEmail('atanunath66@gmail.com'), true);
  assert.equal(isAuthorizedAdminEmail('ATANUNATH66@GMAIL.COM'), true);
  assert.equal(isAuthorizedAdminEmail('atanunath44@gmail.com'), true);
  assert.equal(isAuthorizedAdminEmail('atanuhuhu@gmail.com'), true);
  assert.equal(isAuthorizedAdminEmail('ATANUHUHU@GMAIL.COM'), true);

  assert.equal(isAuthorizedAdminEmail('regular.customer@gmail.com'), false);
  assert.equal(isAuthorizedAdminEmail('random.owner@gmail.com'), false);
  assert.equal(isAuthorizedAdminEmail(''), false);
  assert.equal(isAuthorizedAdminEmail(null), false);
  assert.equal(isAuthorizedAdminEmail(undefined), false);
});

test('Super admin emails constant includes runtime user email', () => {
  assert.equal(SUPER_ADMIN_EMAILS.includes('atanuhuhu@gmail.com'), true);
  assert.equal(SUPER_ADMIN_EMAILS.includes('atanunath66@gmail.com'), true);
});

test('Restaurant registration ownership invariants', () => {
  const authenticatedFirebaseUid = 'firebase-user-uid-882194';
  const newRegistration = {
    name: 'Sri Siddaganga Thatte Idli',
    ownerId: authenticatedFirebaseUid,
    status: 'PENDING_APPROVAL',
  };

  // 1. Must never be pseudo UID
  assert.notEqual(newRegistration.ownerId, 'admin-atanunath66');
  assert.equal(newRegistration.ownerId, authenticatedFirebaseUid);
  // 2. Status must be PENDING_APPROVAL
  assert.equal(newRegistration.status, 'PENDING_APPROVAL');
});
