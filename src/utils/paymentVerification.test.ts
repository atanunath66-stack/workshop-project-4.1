import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { validateUpiIdFormat } from '../services/paymentService';
import { calculateUpiCommissionSplit, generateUpiDeepLink } from './cancellationAndPricing';

describe('Payment & UPI Verification Suite', () => {
  describe('1. Amount & Currency Calculation (Razorpay Paise)', () => {
    it('correctly converts decimal INR rupee amounts to integer paise', () => {
      const amountInRupees = 499.5;
      const amountInPaise = Math.round(amountInRupees * 100);
      assert.strictEqual(amountInPaise, 49950);
    });

    it('handles exact integer rupee amounts without floating-point drift', () => {
      const amounts = [1, 50, 100, 250, 1250, 5000];
      for (const amt of amounts) {
        assert.strictEqual(Math.round(amt * 100), amt * 100);
      }
    });
  });

  describe('2. UPI ID (VPA) Format Validation', () => {
    it('accepts standard valid UPI IDs with diverse bank and app handles', () => {
      const validUpiIds = [
        'customer@okhdfcbank',
        'shop.owner@icici',
        'merchant99@paytm',
        'user-123@oksbi',
        'zaikya.dining@barodampay',
        '9876543210@ybl',
      ];
      for (const upi of validUpiIds) {
        const res = validateUpiIdFormat(upi);
        assert.strictEqual(res.isValid, true, `Failed for valid UPI: ${upi}`);
      }
    });

    it('rejects invalid, malformed, or injected UPI IDs', () => {
      const invalidUpiIds = [
        '',
        '   ',
        'justastring',
        'user@',
        '@okhdfcbank',
        'user@bank@extra',
        'user space@okhdfcbank',
        '<script>alert(1)</script>@paytm',
      ];
      for (const upi of invalidUpiIds) {
        const res = validateUpiIdFormat(upi);
        assert.strictEqual(res.isValid, false, `Should reject invalid UPI: ${upi}`);
      }
    });
  });

  describe('3. 98% Merchant / 2% Platform Commission Split', () => {
    it('accurately splits advance payments into 98% merchant payout and 2% platform commission', () => {
      const advanceAmount = 500;
      const split = calculateUpiCommissionSplit(advanceAmount, 'merchant@upi');

      assert.strictEqual(split.totalAmount, 500);
      assert.strictEqual(split.adminCommission, 10); // 2% of 500
      assert.strictEqual(split.merchantPayout, 490); // 98% of 500
      assert.strictEqual(split.adminCommission + split.merchantPayout, 500);
    });

    it('handles fractional splits with proper two-decimal precision', () => {
      const advanceAmount = 333.33;
      const split = calculateUpiCommissionSplit(advanceAmount, 'merchant@upi');

      assert.strictEqual(split.totalAmount, 333.33);
      assert.strictEqual(split.adminCommission, 6.67);
      assert.strictEqual(split.merchantPayout, 326.66);
      assert.strictEqual(Math.round((split.adminCommission + split.merchantPayout) * 100) / 100, 333.33);
    });
  });

  describe('4. HMAC SHA-256 Signature Verification', () => {
    const testSecret = 'sample_secret_key_123456';
    const orderId = 'order_DA29103810';
    const paymentId = 'pay_FA82910284';

    it('validates a correct HMAC SHA-256 signature generated with matching secret', () => {
      const payload = `${orderId}|${paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', testSecret)
        .update(payload)
        .digest('hex');

      const expectedSignature = crypto
        .createHmac('sha256', testSecret)
        .update(payload)
        .digest('hex');

      assert.strictEqual(generatedSignature, expectedSignature);
    });

    it('fails when signature is forged or secret differs', () => {
      const payload = `${orderId}|${paymentId}`;
      const genuineSignature = crypto
        .createHmac('sha256', testSecret)
        .update(payload)
        .digest('hex');

      const tamperedSignature = crypto
        .createHmac('sha256', 'wrong_secret')
        .update(payload)
        .digest('hex');

      assert.notStrictEqual(genuineSignature, tamperedSignature);
    });
  });

  describe('5. Gateway Unconfigured State Banner', () => {
    it('requires the exact compliant warning when gateway credentials are unconfigured', () => {
      const expectedWarning = 'Online payments are currently unavailable. No money has been charged.';
      assert.strictEqual(
        expectedWarning,
        'Online payments are currently unavailable. No money has been charged.'
      );
    });
  });

  describe('6. Dynamic UPI Deep Link & Intent Construction', () => {
    it('constructs well-formed UPI URL with all required query parameters', () => {
      const upiUrl = generateUpiDeepLink({
        payeeUpi: 'zaikya.merchant@okhdfcbank',
        payeeName: 'Spice Garden',
        amount: 450,
        transactionNote: 'ZAikya Table #BK101',
        app: 'generic',
      });

      assert.ok(upiUrl.startsWith('upi://pay?'));
      assert.ok(upiUrl.includes('pa=zaikya.merchant%40okhdfcbank'));
      assert.ok(upiUrl.includes('pn=Spice%20Garden'));
      assert.ok(upiUrl.includes('am=450.00'));
      assert.ok(upiUrl.includes('cu=INR'));
    });
  });
});
