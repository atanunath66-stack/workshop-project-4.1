import { CancellationPolicy, DiscountCampaign } from '../types';

export interface OrderTotalCalculation {
  subtotal: number;
  discountAmount: number;
  discountApplied: boolean;
  discountMessage?: string;
  taxes: number; // 5% GST on food
  platformFee: number; // ₹10 standard convenience fee
  totalAmount: number;
  advancePercentage: number;
  advanceAmount: number;
  remainingAmount: number;
}

/**
 * Pure calculation for booking / dish pre-orders
 */
export function calculateOrderTotals(
  items: Array<{ price: number; quantity: number }>,
  advancePercentage: number = 50,
  discountCampaign?: DiscountCampaign | null
): OrderTotalCalculation {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  let discountApplied = false;
  let discountMessage = '';

  if (discountCampaign && discountCampaign.isActive) {
    if (subtotal >= discountCampaign.minOrderValue) {
      if (discountCampaign.discountType === 'percentage') {
        const rawDiscount = (subtotal * discountCampaign.discountValue) / 100;
        discountAmount = Math.min(rawDiscount, discountCampaign.maxDiscountCap);
      } else {
        discountAmount = Math.min(discountCampaign.discountValue, discountCampaign.maxDiscountCap);
      }
      discountAmount = Math.min(discountAmount, subtotal);
      discountApplied = true;
      discountMessage = `Applied coupon: ${discountCampaign.code}`;
    } else {
      discountMessage = `Min order of ₹${discountCampaign.minOrderValue} required for coupon ${discountCampaign.code}`;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  // 5% GST on food services in India
  const taxes = Math.round(taxableAmount * 0.05);
  // Flat ₹10 platform convenience fee
  const platformFee = items.length > 0 ? 10 : 0;
  const totalAmount = taxableAmount + taxes + platformFee;

  const validAdvancePercentage = Math.min(100, Math.max(0, advancePercentage));
  const advanceAmount = Math.round((totalAmount * validAdvancePercentage) / 100);
  const remainingAmount = Math.max(0, totalAmount - advanceAmount);

  return {
    subtotal,
    discountAmount,
    discountApplied,
    discountMessage,
    taxes,
    platformFee,
    totalAmount,
    advancePercentage: validAdvancePercentage,
    advanceAmount,
    remainingAmount,
  };
}

export interface CancellationRefundCalculation {
  advancePaid: number;
  deductionAmount: number;
  refundAmount: number;
  isFreeCancellation: boolean;
  policySummary: string;
}

/**
 * Pure calculation for customer cancellation and partial refund rules
 * Important constraints:
 * - Never deduct more than what the customer actually paid
 * - Respect restaurant owner's cancellation policy (fixed or percentage, min fee)
 */
export function calculateCancellationRefund(
  advancePaid: number,
  policy: CancellationPolicy,
  minutesUntilArrival: number = 60
): CancellationRefundCalculation {
  if (advancePaid <= 0) {
    return {
      advancePaid: 0,
      deductionAmount: 0,
      refundAmount: 0,
      isFreeCancellation: true,
      policySummary: 'No advance was paid for this reservation.',
    };
  }

  // Check if within free cancellation window
  if (minutesUntilArrival >= policy.freeCancellationDeadlineMinutes) {
    return {
      advancePaid,
      deductionAmount: 0,
      refundAmount: advancePaid,
      isFreeCancellation: true,
      policySummary: `Free cancellation applied (${minutesUntilArrival} mins before arrival; deadline is ${policy.freeCancellationDeadlineMinutes} mins).`,
    };
  }

  let calculatedDeduction = 0;
  if (policy.type === 'fixed') {
    calculatedDeduction = policy.deductionValue;
  } else {
    // Percentage deduction based on advance paid
    calculatedDeduction = (advancePaid * policy.deductionValue) / 100;
  }

  // Enforce minimum deduction charge
  calculatedDeduction = Math.max(calculatedDeduction, policy.minDeductionCharge);

  // If maximum deduction charge is specified, clamp to it
  if (policy.maxDeductionCharge !== undefined && policy.maxDeductionCharge > 0) {
    calculatedDeduction = Math.min(calculatedDeduction, policy.maxDeductionCharge);
  }

  // CRITICAL RULE: Never deduct more than the advance paid
  const finalDeduction = Math.min(Math.round(calculatedDeduction), advancePaid);
  const refundAmount = Math.max(0, advancePaid - finalDeduction);

  const policySummary =
    policy.type === 'fixed'
      ? `Cancellation charge of ₹${finalDeduction} applies as per restaurant policy.`
      : `${policy.deductionValue}% cancellation fee (min ₹${policy.minDeductionCharge}) applies. Deducted ₹${finalDeduction}.`;

  return {
    advancePaid,
    deductionAmount: finalDeduction,
    refundAmount,
    isFreeCancellation: false,
    policySummary,
  };
}

/**
 * Platform settlement split for financial transparency
 */
export function calculateSettlementSplit(
  totalBill: number,
  advancePaid: number,
  cancellationDeduction: number = 0,
  platformCommissionPercent: number = 5
) {
  // If cancelled with deduction
  if (cancellationDeduction > 0) {
    const platformShare = Math.round((cancellationDeduction * platformCommissionPercent) / 100);
    const restaurantShare = cancellationDeduction - platformShare;
    return {
      type: 'CANCELLATION_SETTLEMENT',
      totalCollected: cancellationDeduction,
      restaurantEarnings: restaurantShare,
      platformRevenue: platformShare,
    };
  }

  // Normal completed booking
  const commission = Math.round((totalBill * platformCommissionPercent) / 100);
  const restaurantNetEarnings = totalBill - commission;

  return {
    type: 'COMPLETED_ORDER_SETTLEMENT',
    totalBill,
    advancePaid,
    counterBalance: totalBill - advancePaid,
    platformCommission: commission,
    restaurantNetEarnings,
  };
}

/**
 * Generate formatted unique receipt ID
 */
export function generateReceiptNumber(bookingId: string): string {
  const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const cleanId = bookingId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `AK-${timestamp}-${cleanId || 'REC1'}`;
}

/**
 * Super Admin Security: strictly restricted to atanunath66@gmail.com and password AtanuNath66@.
 */
export const SUPER_ADMIN_CREDENTIALS = {
  EMAIL: 'atanunath66@gmail.com',
  PASSWORD: 'AtanuNath66@.',
} as const;

export function verifySuperAdminCredentials(email: string, password: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedExpectedEmail = SUPER_ADMIN_CREDENTIALS.EMAIL.toLowerCase();

  if (!normalizedEmail || !password) {
    return {
      isValid: false,
      errorMessage: 'Please enter both your Super Admin email and security password.',
    };
  }

  if (normalizedEmail !== normalizedExpectedEmail) {
    return {
      isValid: false,
      errorMessage: `Access Denied: Only ${SUPER_ADMIN_CREDENTIALS.EMAIL} is authorized to access the Super Admin console.`,
    };
  }

  if (password !== SUPER_ADMIN_CREDENTIALS.PASSWORD) {
    return {
      isValid: false,
      errorMessage: 'Invalid security password. Access to Super Admin console is restricted.',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Role profile access control:
 * - Customer can only access customer profile if logged in with role 'customer'
 * - Shop Owner can only access owner profile/portal if logged in with role 'owner'
 * - Admin can only access admin console if logged in with role 'admin' AND session authenticated
 */
export function canAccessProfile(
  isLoggedIn: boolean,
  currentRole: string,
  targetProfileRole: string,
  isAdminAuthenticated: boolean = false
): { canAccess: boolean; reason?: string } {
  if (!isLoggedIn) {
    return {
      canAccess: false,
      reason: `Please sign in to access your ${targetProfileRole === 'admin' ? 'Super Admin' : targetProfileRole === 'owner' ? 'Shop Owner' : 'Customer'} profile.`,
    };
  }

  if (targetProfileRole === 'admin') {
    if (currentRole !== 'admin' || !isAdminAuthenticated) {
      return {
        canAccess: false,
        reason: 'Super Admin master credentials required.',
      };
    }
  }

  if (targetProfileRole === 'owner' && currentRole !== 'owner') {
    return {
      canAccess: false,
      reason: 'Please sign in with a Store Owner account to manage your restaurant profile.',
    };
  }

  return { canAccess: true };
}

/**
 * Validate customer registration/login input:
 * Checks email validity and format
 */
export function validateCustomerAuth(email: string, name?: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }
  return { isValid: true };
}

/**
 * Super Admin 2% UPI Commission Configuration
 * All payments automatically calculate a 2% platform convenience fee routed to this account.
 */
export const SUPER_ADMIN_UPI_CONFIG = {
  UPI_ID: 'atanunath66@oksbi',
  COMMISSION_PERCENTAGE: 2, // 2% platform fee
} as const;

/**
 * Mask any UPI ID for privacy so it is NEVER exposed in the public app UI.
 * Requirement: "but don't show anyone's upi id in the app"
 * Example: "atanunath66@oksbi" -> "••••••••66@oksbi"
 * Example: "stallcorner@okhdfcbank" -> "••••••••er@okhdfcbank"
 */
export function maskUpiId(upiId?: string): string {
  if (!upiId || !upiId.includes('@')) {
    return '••••••••@upi';
  }
  const parts = upiId.split('@');
  const handle = parts[0] || '';
  const bank = parts[1] || 'upi';

  if (handle.length <= 2) {
    return `••@${bank}`;
  }
  const visible = handle.slice(-2);
  return `••••••••${visible}@${bank}`;
}

export interface UpiSplitResult {
  totalAmount: number;
  adminCommission: number; // 2%
  merchantPayout: number; // 98%
  adminUpiMasked: string;
  merchantUpiMasked: string;
  adminUpiRaw: string;
  merchantUpiRaw: string;
}

/**
 * Calculate 98% merchant direct settlement and 2% admin platform fee
 */
export function calculateUpiCommissionSplit(
  amount: number,
  merchantUpiId?: string
): UpiSplitResult {
  const cleanAmount = Math.max(0, amount);
  // Calculate 2% platform commission
  const adminCommission = Math.round(cleanAmount * 0.02 * 100) / 100;
  // Calculate 98% merchant payout
  const merchantPayout = Math.max(0, Math.round((cleanAmount - adminCommission) * 100) / 100);

  const rawMerchantUpi = merchantUpiId?.trim() || 'merchant@upi';
  const rawAdminUpi = SUPER_ADMIN_UPI_CONFIG.UPI_ID;

  return {
    totalAmount: cleanAmount,
    adminCommission,
    merchantPayout,
    adminUpiMasked: maskUpiId(rawAdminUpi),
    merchantUpiMasked: maskUpiId(rawMerchantUpi),
    adminUpiRaw: rawAdminUpi,
    merchantUpiRaw: rawMerchantUpi,
  };
}

/**
 * Generate native Indian UPI Deep-Link URI schemes
 * - GPay: tez://upi/pay?...
 * - PhonePe: phonepe://pay?...
 * - Standard fallback: upi://pay?...
 */
export function generateUpiDeepLink(options: {
  payeeUpi: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  app?: 'gpay' | 'phonepe' | 'generic';
}): string {
  const payee = options.payeeUpi || 'merchant@upi';
  const name = encodeURIComponent(options.payeeName || 'Store Merchant');
  const note = encodeURIComponent(options.transactionNote || 'Food Pre-Booking');
  const amountStr = options.amount.toFixed(2);
  const baseQuery = `pa=${encodeURIComponent(payee)}&pn=${name}&am=${amountStr}&cu=INR&tn=${note}`;

  if (options.app === 'gpay') {
    return `tez://upi/pay?${baseQuery}`;
  }
  if (options.app === 'phonepe') {
    return `phonepe://pay?${baseQuery}`;
  }
  return `upi://pay?${baseQuery}`;
}


