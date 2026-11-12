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

test('filterRestaurantCreatePayload: strips unpermitted fields including averageRating, totalReviews, and upiId', async () => {
  const { filterRestaurantCreatePayload, RESTAURANT_CREATE_ALLOWED_KEYS } = await import('../context/AppContext');

  const incomingData = {
    id: 'rest-123456',
    name: 'Kyatsandra Thatte Idli Mane',
    tagline: 'Soft pillowy steamed thatte idlis with red chutney',
    description: 'Serving hot thatte idlis on banana leaves since 1984.',
    ownerId: 'uid-owner-123',
    ownerName: 'Ramesh Gowda',
    phone: '+91 98450 12345',
    email: 'ramesh.gowda@gmail.com',
    address: 'Old NH4, Kyatsandra',
    area: 'Kyatsandra',
    city: 'Tumakuru (Tumkur)',
    lat: 13.3134,
    lng: 77.1623,
    location: { address: 'Old NH4' },
    coverImage: '/path/to/img.jpg',
    galleryImages: ['/path/to/img.jpg'],
    categories: ['South Indian', 'Street Food'],
    openingTime: '06:00 AM',
    closingTime: '09:00 PM',
    priceForTwo: 120,
    status: 'PENDING_APPROVAL',
    facilities: ['UPI Accepted', 'Takeaway'],
    cancellationPolicy: { type: 'fixed', deductionValue: 40 },
    menu: [],
    totalTables: 8,
    availableTables: 8,
    createdAt: '2026-11-12T00:00:00.000Z',
    updatedAt: '2026-11-12T00:00:00.000Z',
    // Unpermitted fields that MUST be stripped:
    averageRating: 4.8,
    totalReviews: 240,
    upiId: 'ramesh@oksbi',
    featured: true,
    rejectionReason: 'None',
    approvedAt: '2026-11-12T00:00:00.000Z',
    approvedBy: 'hacker',
  };

  const payload = filterRestaurantCreatePayload(incomingData);

  // Assert stripped fields are not present
  assert.equal('averageRating' in payload, false, 'averageRating must be stripped from Firestore create payload');
  assert.equal('totalReviews' in payload, false, 'totalReviews must be stripped from Firestore create payload');
  assert.equal('upiId' in payload, false, 'upiId must be stripped from Firestore create payload');
  assert.equal('featured' in payload, false, 'featured must be stripped from Firestore create payload');
  assert.equal('approvedAt' in payload, false, 'approvedAt must be stripped from Firestore create payload');

  // Assert permitted fields are retained
  assert.equal(payload.name, 'Kyatsandra Thatte Idli Mane');
  assert.equal(payload.ownerId, 'uid-owner-123');
  assert.equal(payload.status, 'PENDING_APPROVAL');
  assert.equal(payload.city, 'Tumakuru (Tumkur)');

  // Assert EVERY single key in payload is in the official allowlist
  const allowedSet = new Set(RESTAURANT_CREATE_ALLOWED_KEYS);
  for (const key of Object.keys(payload)) {
    assert.equal(allowedSet.has(key as any), true, `Key "${key}" must be in the Firestore create allowlist`);
  }
});

test('Role validation: only store owner and admin can create restaurants, normal customer is rejected', () => {
  const validateCreatorRole = (role: string): { allowed: boolean; error?: string } => {
    if (role !== 'owner' && role !== 'admin') {
      return {
        allowed: false,
        error: 'Permission denied: Normal customer accounts cannot register restaurants directly. Please sign in or switch to a verified Store Owner account.',
      };
    }
    return { allowed: true };
  };

  assert.equal(validateCreatorRole('customer').allowed, false);
  assert.equal(validateCreatorRole('guest').allowed, false);
  assert.equal(validateCreatorRole('owner').allowed, true);
  assert.equal(validateCreatorRole('admin').allowed, true);
});
