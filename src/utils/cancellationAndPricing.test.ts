import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderTotals,
  calculateCancellationRefund,
  calculateSettlementSplit,
  generateReceiptNumber,
  verifySuperAdminCredentials,
  canAccessProfile,
  validateCustomerAuth,
  maskUpiId,
  calculateUpiCommissionSplit,
  generateUpiDeepLink,
  SUPER_ADMIN_UPI_CONFIG,
} from './cancellationAndPricing';
import { CancellationPolicy, DiscountCampaign } from '../types';

test('calculateOrderTotals: computes subtotal, 5% GST, ₹10 fee, 50% advance correctly', () => {
  const items = [
    { price: 200, quantity: 2 }, // 400
    { price: 100, quantity: 1 }, // 100
  ]; // subtotal = 500

  const totals = calculateOrderTotals(items, 50, null);

  assert.equal(totals.subtotal, 500);
  assert.equal(totals.discountAmount, 0);
  // 5% GST on 500 = 25
  assert.equal(totals.taxes, 25);
  // Platform fee = 10
  assert.equal(totals.platformFee, 10);
  // Grand total = 500 + 25 + 10 = 535
  assert.equal(totals.totalAmount, 535);
  // 50% advance = round(535 * 0.5) = 268
  assert.equal(totals.advanceAmount, 268);
  // Remaining = 535 - 268 = 267
  assert.equal(totals.remainingAmount, 267);
});

test('calculateOrderTotals: applies discount coupon with caps and min order rules', () => {
  const items = [{ price: 300, quantity: 2 }]; // 600

  const campaign: DiscountCampaign = {
    id: 'disc-1',
    code: 'GULLY20',
    title: '20% OFF',
    description: 'Get 20% off up to ₹100 on orders over ₹400',
    discountType: 'percentage',
    discountValue: 20, // 20% of 600 is 120, capped at 100
    minOrderValue: 400,
    maxDiscountCap: 100,
    applicableToAll: true,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    maxRedemptions: 100,
    redemptionCount: 0,
    isActive: true,
  };

  const totals = calculateOrderTotals(items, 50, campaign);
  assert.equal(totals.subtotal, 600);
  assert.equal(totals.discountAmount, 100); // capped at 100
  assert.equal(totals.discountApplied, true);
  // Taxable: 600 - 100 = 500. GST: 25. Fee: 10. Total: 535.
  assert.equal(totals.totalAmount, 535);
});

test('calculateCancellationRefund: within free cancellation window returns 100% refund', () => {
  const policy: CancellationPolicy = {
    type: 'fixed',
    deductionValue: 40,
    minDeductionCharge: 40,
    freeCancellationDeadlineMinutes: 30,
    allowCancellationAfterPrepStarts: false,
    termsText: 'Free cancellation up to 30 mins before arrival. ₹40 deduction thereafter.',
  };

  // 45 minutes before arrival (>= 30 mins deadline)
  const result = calculateCancellationRefund(250, policy, 45);
  assert.equal(result.isFreeCancellation, true);
  assert.equal(result.deductionAmount, 0);
  assert.equal(result.refundAmount, 250);
});

test('calculateCancellationRefund: applies fixed deduction correctly when past deadline', () => {
  const policy: CancellationPolicy = {
    type: 'fixed',
    deductionValue: 40,
    minDeductionCharge: 40,
    freeCancellationDeadlineMinutes: 30,
    allowCancellationAfterPrepStarts: false,
    termsText: '₹40 flat deduction applies within 30 mins of arrival.',
  };

  // 15 minutes before arrival (< 30 mins deadline)
  const result = calculateCancellationRefund(250, policy, 15);
  assert.equal(result.isFreeCancellation, false);
  assert.equal(result.deductionAmount, 40);
  assert.equal(result.refundAmount, 210);
});

test('calculateCancellationRefund: never deducts more than advance paid', () => {
  const policy: CancellationPolicy = {
    type: 'fixed',
    deductionValue: 100,
    minDeductionCharge: 50,
    freeCancellationDeadlineMinutes: 30,
    allowCancellationAfterPrepStarts: false,
    termsText: '₹100 charge',
  };

  // If customer only paid ₹40 advance
  const result = calculateCancellationRefund(40, policy, 10);
  assert.equal(result.deductionAmount, 40); // capped at 40
  assert.equal(result.refundAmount, 0); // refund is 0, never negative
});

test('calculateSettlementSplit: splits completed order and cancellation properly', () => {
  const completedSplit = calculateSettlementSplit(500, 250, 0, 5);
  assert.equal(completedSplit.type, 'COMPLETED_ORDER_SETTLEMENT');
  assert.equal(completedSplit.platformCommission, 25); // 5% of 500
  assert.equal(completedSplit.restaurantNetEarnings, 475);

  const cancelledSplit = calculateSettlementSplit(500, 250, 40, 5);
  assert.equal(cancelledSplit.type, 'CANCELLATION_SETTLEMENT');
  assert.equal(cancelledSplit.totalCollected, 40);
  assert.equal(cancelledSplit.platformRevenue, 2); // 5% of 40 = 2
  assert.equal(cancelledSplit.restaurantEarnings, 38);
});

test('generateReceiptNumber: produces formatted receipt identifier', () => {
  const num = generateReceiptNumber('bkg-8971');
  assert.match(num, /^AK-\d{6}-[A-Z0-9]{4}$/);
});

test('verifySuperAdminCredentials: only grants access to atanunath66@gmail.com with AtanuNath66@.', () => {
  // Correct credentials
  const valid = verifySuperAdminCredentials('atanunath66@gmail.com', 'AtanuNath66@.');
  assert.equal(valid.isValid, true);
  assert.equal(valid.errorMessage, undefined);

  // Correct credentials with whitespace / case
  const validCase = verifySuperAdminCredentials('  ATANUNATH66@GMAIL.COM  ', 'AtanuNath66@.');
  assert.equal(validCase.isValid, true);

  // Wrong email
  const wrongEmail = verifySuperAdminCredentials('otheradmin@gmail.com', 'AtanuNath66@.');
  assert.equal(wrongEmail.isValid, false);
  assert.match(wrongEmail.errorMessage || '', /Only atanunath66@gmail.com is authorized/);

  // Wrong password
  const wrongPass = verifySuperAdminCredentials('atanunath66@gmail.com', 'WrongPassword123');
  assert.equal(wrongPass.isValid, false);
  assert.match(wrongPass.errorMessage || '', /Invalid security password/);

  // Empty credentials
  const empty = verifySuperAdminCredentials('', '');
  assert.equal(empty.isValid, false);
});

test('canAccessProfile: gates customer, shop owner and admin profiles behind login', () => {
  // Not logged in cannot access any role profile
  assert.equal(canAccessProfile(false, 'customer', 'customer').canAccess, false);
  assert.equal(canAccessProfile(false, 'owner', 'owner').canAccess, false);
  assert.equal(canAccessProfile(false, 'admin', 'admin').canAccess, false);

  // Logged-in customer can access customer profile, but not owner or admin profile
  assert.equal(canAccessProfile(true, 'customer', 'customer').canAccess, true);
  assert.equal(canAccessProfile(true, 'customer', 'owner').canAccess, false);
  assert.equal(canAccessProfile(true, 'customer', 'admin').canAccess, false);

  // Logged-in owner can access owner profile, but not admin profile
  assert.equal(canAccessProfile(true, 'owner', 'owner').canAccess, true);
  assert.equal(canAccessProfile(true, 'owner', 'admin').canAccess, false);

  // Admin without authenticated session cannot access admin profile
  assert.equal(canAccessProfile(true, 'admin', 'admin', false).canAccess, false);
  // Admin with authenticated session can access admin profile
  assert.equal(canAccessProfile(true, 'admin', 'admin', true).canAccess, true);
});

test('validateCustomerAuth: validates email format correctly', () => {
  assert.equal(validateCustomerAuth('foodie@gmail.com').isValid, true);
  assert.equal(validateCustomerAuth('invalid-email').isValid, false);
  assert.equal(validateCustomerAuth('').isValid, false);
});

test('karnatakaLocations: includes Tumakuru (Tumkur) hubs and statewide districts', async () => {
  const { KARNATAKA_LOCATIONS, KARNATAKA_DISTRICTS } = await import('../data/karnatakaLocations');

  // Verify Tumakuru district is covered
  assert.equal(KARNATAKA_DISTRICTS.includes('Tumakuru'), true);

  // Filter Tumakuru locations
  const tumakuruSpots = KARNATAKA_LOCATIONS.filter((l) => l.district === 'Tumakuru');
  assert.ok(tumakuruSpots.length >= 6, 'Expected multiple Tumakuru locations');

  // Check specific iconic hubs
  const kyatsandra = tumakuruSpots.find((l) => l.area === 'Kyatsandra');
  assert.ok(kyatsandra, 'Expected Kyatsandra in Tumakuru');
  assert.match(kyatsandra.popularDishTag, /Thatte Idli/i);

  const townHall = tumakuruSpots.find((l) => l.area.includes('MG Road'));
  assert.ok(townHall, 'Expected MG Road in Tumakuru');

  const siddaganga = tumakuruSpots.find((l) => l.area.includes('Siddaganga'));
  assert.ok(siddaganga, 'Expected Siddaganga Math Road in Tumakuru');

  // Verify all Karnataka locations have valid fields
  KARNATAKA_LOCATIONS.forEach((loc) => {
    assert.ok(loc.city.length > 0, `Missing city for ${loc.area}`);
    assert.ok(loc.area.length > 0, `Missing area for ${loc.city}`);
    assert.ok(loc.district.length > 0, `Missing district for ${loc.area}`);
  });
});

test('maskUpiId: enforces strict privacy and never leaks full UPI username', () => {
  // Test admin UPI id masking
  const adminMasked = maskUpiId('atanunath66@oksbi');
  assert.equal(adminMasked, '••••••••66@oksbi');
  assert.equal(adminMasked.includes('atanunath'), false, 'Should not reveal admin username');

  // Test merchant UPI id masking
  const merchantMasked = maskUpiId('kyatsandra.idli@okhdfcbank');
  assert.equal(merchantMasked.includes('li@okhdfcbank'), true);
  assert.equal(merchantMasked.includes('kyatsandra'), false, 'Should not reveal merchant handle');

  // Test phone number UPI id
  const phoneMasked = maskUpiId('9876543210@paytm');
  assert.equal(phoneMasked, '••••••••10@paytm');
  assert.equal(phoneMasked.includes('98765432'), false);

  // Fallback on empty or missing
  assert.equal(maskUpiId(''), '••••••••@upi');
  assert.equal(maskUpiId(undefined), '••••••••@upi');
});

test('calculateUpiCommissionSplit: accurately splits 2% platform commission and 98% merchant payout', () => {
  // Super Admin UPI config verification
  assert.equal(SUPER_ADMIN_UPI_CONFIG.UPI_ID, 'atanunath66@oksbi');
  assert.equal(SUPER_ADMIN_UPI_CONFIG.COMMISSION_PERCENTAGE, 2);

  // Case 1: ₹500 advance payment
  const split500 = calculateUpiCommissionSplit(500, 'merchantseller@upi');
  assert.equal(split500.adminCommission, 10); // 2% of 500 = 10
  assert.equal(split500.merchantPayout, 490);  // 98% of 500 = 490
  assert.equal(split500.adminUpiRaw, 'atanunath66@oksbi');
  assert.equal(split500.adminUpiMasked, '••••••••66@oksbi');
  assert.equal(split500.merchantUpiMasked, '••••••••er@upi');

  // Case 2: ₹1000 payment
  const split1000 = calculateUpiCommissionSplit(1000, 'tumkurdosa@okhdfcbank');
  assert.equal(split1000.adminCommission, 20); // 2% of 1000 = 20
  assert.equal(split1000.merchantPayout, 980);  // 98% of 1000 = 980
  assert.equal(split1000.merchantUpiMasked, '••••••••sa@okhdfcbank');

  // Case 3: Small payment (₹25 advance)
  const split25 = calculateUpiCommissionSplit(25, 'tea.stall@oksbi');
  assert.equal(split25.adminCommission, 0.5);
  assert.equal(split25.merchantPayout, 24.5);
  assert.equal(split25.merchantPayout + split25.adminCommission, 25);
});

test('generateUpiDeepLink: constructs compliant deep link intent URIs for GPay, PhonePe, and UPI', () => {
  const options = {
    payeeUpi: 'tumkurstall@okhdfcbank',
    payeeName: 'Tumakuru Thatte Idli',
    amount: 150,
    transactionNote: 'ZAikya Order bkg-101',
  };

  // Google Pay intent deep link
  const gpayUrl = generateUpiDeepLink({ ...options, app: 'gpay' });
  assert.ok(gpayUrl.startsWith('tez://upi/pay?'));
  assert.ok(gpayUrl.includes('pa=tumkurstall%40okhdfcbank'));
  assert.ok(gpayUrl.includes('am=150.00'));
  assert.ok(gpayUrl.includes('cu=INR'));

  // PhonePe intent deep link
  const phonepeUrl = generateUpiDeepLink({ ...options, app: 'phonepe' });
  assert.ok(phonepeUrl.startsWith('phonepe://pay?'));
  assert.ok(phonepeUrl.includes('pa=tumkurstall%40okhdfcbank'));
  assert.ok(phonepeUrl.includes('am=150.00'));

  // Generic UPI deep link
  const upiUrl = generateUpiDeepLink({ ...options, app: 'generic' });
  assert.ok(upiUrl.startsWith('upi://pay?'));
  assert.ok(upiUrl.includes('pa=tumkurstall%40okhdfcbank'));
});

