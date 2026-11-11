import test from 'node:test';
import assert from 'node:assert/strict';

// Helper mock types & evaluation logic representing the production firestore.rules
const SUPER_ADMIN_EMAILS = [
  'atanunath66@gmail.com',
  'atanunath44@gmail.com',
  'atanuhuhu@gmail.com',
];

interface SecurityContext {
  auth: {
    uid: string | null;
    token?: {
      email?: string;
      email_verified?: boolean;
      admin?: boolean;
      role?: string;
    };
  } | null;
}

function evaluateIsSuperAdmin(context: SecurityContext): boolean {
  if (!context.auth || !context.auth.uid) return false;
  const token = context.auth.token || {};
  const isEmailVerified = token.email_verified === true;
  const emailMatch = token.email ? SUPER_ADMIN_EMAILS.includes(token.email.toLowerCase()) : false;
  const hasCustomClaim = token.admin === true || token.role === 'admin';
  return (isEmailVerified && emailMatch) || hasCustomClaim;
}

function evaluateRestaurantOwnerUpdate(
  context: SecurityContext,
  resource: { ownerId: string; status: string; [key: string]: any },
  requestResource: { ownerId: string; status: string; [key: string]: any }
): { allowed: boolean; reason?: string } {
  if (!context.auth || !context.auth.uid) return { allowed: false, reason: 'Unauthenticated' };
  if (evaluateIsSuperAdmin(context)) return { allowed: true };

  // Owner check
  if (resource.ownerId !== context.auth.uid) return { allowed: false, reason: 'Not owner' };
  if (requestResource.ownerId !== resource.ownerId) return { allowed: false, reason: 'Cannot change ownerId' };
  if (requestResource.status !== resource.status) return { allowed: false, reason: 'Cannot change status' };

  const allowedKeys = new Set([
    'name',
    'tagline',
    'description',
    'phone',
    'ownerPhone',
    'email',
    'address',
    'area',
    'city',
    'lat',
    'lng',
    'location',
    'coverImage',
    'galleryImages',
    'categories',
    'openingTime',
    'closingTime',
    'priceForTwo',
    'facilities',
    'cancellationPolicy',
    'menu',
    'totalTables',
    'availableTables',
    'updatedAt',
  ]);

  // Check changed keys
  const changedKeys = Object.keys(requestResource).filter((key) => requestResource[key] !== resource[key]);
  for (const key of changedKeys) {
    if (!allowedKeys.has(key)) {
      return { allowed: false, reason: `Field '${key}' is not in the owner allowlist` };
    }
  }

  return { allowed: true };
}

function evaluateBookingCreate(
  context: SecurityContext,
  requestResource: { [key: string]: any }
): { allowed: boolean; reason?: string } {
  if (!context.auth || !context.auth.uid) return { allowed: false, reason: 'Unauthenticated' };
  if (evaluateIsSuperAdmin(context)) return { allowed: true };

  if (requestResource.customerId !== context.auth.uid) {
    return { allowed: false, reason: 'customerId mismatch' };
  }

  if (requestResource.status !== 'PENDING') {
    return { allowed: false, reason: 'Customer can only create PENDING booking' };
  }

  if (requestResource.paymentStatus !== 'PENDING') {
    return { allowed: false, reason: 'paymentStatus must be PENDING on creation' };
  }

  const forbiddenKeys = [
    'subtotal',
    'discountAmount',
    'taxes',
    'platformFee',
    'totalAmount',
    'advanceAmount',
    'remainingAmount',
    'adminPlatformCommission',
    'merchantPayoutAmount',
    'refundAmount',
    'refundStatus',
    'refundTransactionId',
    'cancellationDeduction',
    'razorpayPaymentId',
    'paidAt',
  ];

  for (const forbidden of forbiddenKeys) {
    if (forbidden in requestResource) {
      return { allowed: false, reason: `Forbidden trusted field '${forbidden}' present` };
    }
  }

  return { allowed: true };
}

function evaluateOwnerBookingTransition(currentStatus: string, nextStatus: string): boolean {
  if (nextStatus === currentStatus) return true;
  if (currentStatus === 'PENDING') return nextStatus === 'ACCEPTED' || nextStatus === 'REJECTED';
  if (currentStatus === 'CONFIRMED') return nextStatus === 'ACCEPTED' || nextStatus === 'REJECTED';
  if (currentStatus === 'ACCEPTED') {
    return nextStatus === 'CUSTOMER ARRIVING' || nextStatus === 'ARRIVED' || nextStatus === 'REJECTED';
  }
  if (currentStatus === 'CUSTOMER ARRIVING') return nextStatus === 'ARRIVED' || nextStatus === 'REJECTED';
  if (currentStatus === 'ARRIVED') return nextStatus === 'SERVED' || nextStatus === 'COMPLETED';
  if (currentStatus === 'SERVED') return nextStatus === 'COMPLETED';
  return false;
}

// -----------------------------------------------------------------------------
// Security Test Suite
// -----------------------------------------------------------------------------

test('Security 1: Super Admin requires verified email and prevents spoofing', () => {
  // Unverified email
  assert.strictEqual(
    evaluateIsSuperAdmin({
      auth: { uid: 'u1', token: { email: 'atanunath66@gmail.com', email_verified: false } },
    }),
    false,
    'Unverified admin email must be rejected'
  );

  // Non-whitelisted email
  assert.strictEqual(
    evaluateIsSuperAdmin({
      auth: { uid: 'u2', token: { email: 'hacker@gmail.com', email_verified: true } },
    }),
    false,
    'Non-admin verified email must be rejected'
  );

  // Verified admin email
  assert.strictEqual(
    evaluateIsSuperAdmin({
      auth: { uid: 'u3', token: { email: 'atanuhuhu@gmail.com', email_verified: true } },
    }),
    true,
    'Verified admin email must be accepted'
  );

  // Custom claim admin
  assert.strictEqual(
    evaluateIsSuperAdmin({
      auth: { uid: 'u4', token: { admin: true } },
    }),
    true,
    'Custom claim admin must be accepted'
  );
});

test('Security 2: Restaurant owner cannot self-approve or modify ratings or settlement fields', () => {
  const context: SecurityContext = { auth: { uid: 'owner-123' } };
  const resource = {
    id: 'rest-1',
    ownerId: 'owner-123',
    status: 'PENDING_APPROVAL',
    name: 'Dosa Camp',
    averageRating: 4.5,
    totalReviews: 120,
    upiId: 'merchant@upi',
  };

  // Attempting to self-approve status to ACTIVE
  const selfApprove = evaluateRestaurantOwnerUpdate(context, resource, {
    ...resource,
    status: 'ACTIVE',
  });
  assert.strictEqual(selfApprove.allowed, false, 'Owner cannot self-approve restaurant to ACTIVE');

  // Attempting to alter rating
  const alterRating = evaluateRestaurantOwnerUpdate(context, resource, {
    ...resource,
    averageRating: 5.0,
  });
  assert.strictEqual(alterRating.allowed, false, 'Owner cannot modify average rating');

  // Attempting to alter review count
  const alterReviews = evaluateRestaurantOwnerUpdate(context, resource, {
    ...resource,
    totalReviews: 9999,
  });
  assert.strictEqual(alterReviews.allowed, false, 'Owner cannot modify total reviews count');

  // Legitimate menu or description update
  const legitUpdate = evaluateRestaurantOwnerUpdate(context, resource, {
    ...resource,
    tagline: 'Best South Indian Breakfast in Town',
    updatedAt: new Date().toISOString(),
  });
  assert.strictEqual(legitUpdate.allowed, true, 'Owner can update permitted profile fields');
});

test('Security 3: Customer cannot forge paymentStatus, advance amounts, or pricing on creation', () => {
  const context: SecurityContext = { auth: { uid: 'cust-456' } };

  // Attempting to inject ADVANCE_PAID
  const fakePaid = evaluateBookingCreate(context, {
    customerId: 'cust-456',
    status: 'PENDING',
    paymentStatus: 'ADVANCE_PAID',
    items: [],
  });
  assert.strictEqual(fakePaid.allowed, false, 'Client cannot create booking with paymentStatus: ADVANCE_PAID');

  // Attempting to supply client-calculated totalAmount or advanceAmount
  const fakeTotals = evaluateBookingCreate(context, {
    customerId: 'cust-456',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    totalAmount: 1, // Attempted ₹1 fraud
    advanceAmount: 1,
    items: [],
  });
  assert.strictEqual(fakeTotals.allowed, false, 'Client cannot supply trusted pricing fields on creation');

  // Legitimate client booking intent payload
  const legitBooking = evaluateBookingCreate(context, {
    id: 'bkg-001',
    receiptNumber: 'REC-001',
    customerId: 'cust-456',
    restaurantId: 'rest-1',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    items: [{ menuItemId: 'm1', quantity: 2 }],
  });
  assert.strictEqual(legitBooking.allowed, true, 'Legitimate booking creation is permitted');
});

test('Security 4: Booking lifecycle transitions enforce strict sequence and forbid invalid shortcuts', () => {
  // Invalid jump from PENDING directly to COMPLETED
  assert.strictEqual(
    evaluateOwnerBookingTransition('PENDING', 'COMPLETED'),
    false,
    'Cannot skip from PENDING to COMPLETED'
  );

  // Invalid jump from PENDING to SERVED
  assert.strictEqual(
    evaluateOwnerBookingTransition('PENDING', 'SERVED'),
    false,
    'Cannot skip from PENDING to SERVED'
  );

  // Valid flow: PENDING -> ACCEPTED
  assert.strictEqual(
    evaluateOwnerBookingTransition('PENDING', 'ACCEPTED'),
    true,
    'Owner can accept PENDING booking'
  );

  // Valid flow: PENDING -> REJECTED
  assert.strictEqual(
    evaluateOwnerBookingTransition('PENDING', 'REJECTED'),
    true,
    'Owner can reject PENDING booking'
  );

  // Valid flow: ACCEPTED -> ARRIVED -> SERVED -> COMPLETED
  assert.strictEqual(evaluateOwnerBookingTransition('ACCEPTED', 'ARRIVED'), true);
  assert.strictEqual(evaluateOwnerBookingTransition('ARRIVED', 'SERVED'), true);
  assert.strictEqual(evaluateOwnerBookingTransition('SERVED', 'COMPLETED'), true);

  // Terminal state cannot change
  assert.strictEqual(
    evaluateOwnerBookingTransition('COMPLETED', 'ACCEPTED'),
    false,
    'Completed booking is terminal'
  );
  assert.strictEqual(
    evaluateOwnerBookingTransition('REJECTED', 'ACCEPTED'),
    false,
    'Rejected booking is terminal'
  );
});

test('Security 5: Unauthenticated access is completely blocked', () => {
  const unauthContext: SecurityContext = { auth: null };

  const createAttempt = evaluateBookingCreate(unauthContext, {
    customerId: 'anon',
    status: 'PENDING',
    paymentStatus: 'PENDING',
  });
  assert.strictEqual(createAttempt.allowed, false, 'Unauthenticated user cannot create booking');

  const updateAttempt = evaluateRestaurantOwnerUpdate(
    unauthContext,
    { ownerId: 'any', status: 'ACTIVE' },
    { ownerId: 'any', status: 'ACTIVE', name: 'Hacked' }
  );
  assert.strictEqual(updateAttempt.allowed, false, 'Unauthenticated user cannot update restaurant');
});
