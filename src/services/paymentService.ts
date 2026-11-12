/**
 * ZAikya Real Payment Service
 *
 * Integrates with Razorpay backend API (/api/payments/...) for secure
 * order creation, cryptographic verification, dynamic QR generation,
 * and UPI intent handling.
 *
 * Strict security principles:
 * - Orders created exclusively on trusted backend.
 * - Frontend callbacks never trusted without backend signature verification.
 * - Never stores or logs UPI PINs, OTPs, or passwords.
 * - Handles unconfigured gateway gracefully.
 */

export interface PaymentGatewayConfig {
  isConfigured: boolean;
  keyId: string | null;
  merchantName: string;
  currency: string;
  message: string;
}

export interface PaymentOrderResponse {
  success: boolean;
  orderId?: string;
  amount?: number; // in paise
  currency?: string;
  keyId?: string;
  bookingId?: string;
  message?: string;
  isConfigured?: boolean;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  transactionId?: string;
  orderId?: string;
  bookingId?: string;
  amount?: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  method?: string;
  vpa?: string | null;
  merchantPayoutAmount?: number;
  adminPlatformCommission?: number;
  verifiedAt?: string;
  message?: string;
  alreadyProcessed?: boolean;
}

export interface DynamicQrResponse {
  success: boolean;
  qrCodeDataUrl?: string;
  upiUrl?: string;
  transactionRef?: string;
  amount?: number;
  currency?: string;
  bookingId?: string;
  restaurantName?: string;
  expiresAt?: string;
  message?: string;
}

export interface UpiCollectResponse {
  success: boolean;
  collectSupported: boolean;
  message: string;
  alternative?: 'qr_or_intent';
  validatedUpiId?: string;
}

/**
 * Check if Razorpay gateway credentials are configured on the backend
 */
export async function fetchPaymentConfig(): Promise<PaymentGatewayConfig> {
  try {
    const res = await fetch('/api/payments/config');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[Payment Service] Failed to fetch gateway config:', err);
    return {
      isConfigured: false,
      keyId: null,
      merchantName: 'ZAikya Hyperlocal Dining',
      currency: 'INR',
      message: 'Online payments are currently unavailable. No money has been charged.',
    };
  }
}

/**
 * Create order on trusted backend
 */
export async function createBackendPaymentOrder(params: {
  bookingId: string;
  amount: number;
  restaurantName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentType?: 'ADVANCE' | 'REMAINING';
}): Promise<PaymentOrderResponse> {
  try {
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error while contacting payment server.',
      isConfigured: false,
    };
  }
}

/**
 * Verify payment signature and gateway status on trusted backend
 */
export async function verifyPaymentOnBackend(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingId: string;
  amount: number;
}): Promise<VerificationResult> {
  try {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.verified) {
      return {
        success: false,
        verified: false,
        status: 'FAILED',
        message: data.message || 'Payment verification failed on server.',
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      verified: false,
      status: 'FAILED',
      message: err?.message || 'Network error during payment verification.',
    };
  }
}

/**
 * Generate unique dynamic UPI QR code for this booking
 */
export async function fetchDynamicUpiQr(params: {
  bookingId: string;
  amount: number;
  restaurantName: string;
  payeeUpi?: string;
}): Promise<DynamicQrResponse> {
  try {
    const res = await fetch('/api/payments/dynamic-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to generate dynamic UPI QR code.',
    };
  }
}

/**
 * Request UPI collect or verify collect eligibility
 */
export async function requestUpiCollect(params: {
  bookingId: string;
  upiId: string;
  amount: number;
  restaurantName: string;
}): Promise<UpiCollectResponse> {
  try {
    const res = await fetch('/api/payments/upi-collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      collectSupported: false,
      message: err?.message || 'Failed to process UPI collect request.',
      alternative: 'qr_or_intent',
    };
  }
}

/**
 * Poll payment status from gateway
 */
export async function pollPaymentStatus(id: string): Promise<{
  success: boolean;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transactionId?: string;
  amount?: number;
  method?: string;
}> {
  try {
    const res = await fetch(`/api/payments/status/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      status: 'PENDING',
    };
  }
}

/**
 * Validates format of entered UPI ID (VPA)
 */
export function validateUpiIdFormat(vpa: string): { isValid: boolean; error?: string } {
  if (!vpa || typeof vpa !== 'string') {
    return { isValid: false, error: 'UPI ID is required.' };
  }
  const trimmed = vpa.trim();
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid UPI ID format. Expected format: username@bank or mobile@upi (e.g. rahul@oksbi).',
    };
  }
  return { isValid: true };
}

/**
 * Dynamically load Razorpay standard checkout script if not present
 */
export function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[Payment Service] Failed to load Razorpay checkout.js script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Launch Razorpay standard checkout modal with full UPI, Card, NetBanking options,
 * and verify the returned signature on the backend before completing.
 */
export async function openRazorpayCheckout(options: {
  orderId: string;
  keyId: string;
  amountInPaise: number;
  bookingId: string;
  restaurantName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (verifiedResult: VerificationResult) => void;
  onFailure: (errorMsg: string) => void;
  onDismiss?: () => void;
}) {
  const loaded = await loadRazorpayCheckoutScript();
  if (!loaded || !(window as any).Razorpay) {
    options.onFailure('Could not load payment checkout gateway. Please check your internet connection.');
    return;
  }

  const razorpayOptions = {
    key: options.keyId,
    amount: options.amountInPaise,
    currency: 'INR',
    name: 'ZAikya Dining',
    description: `Reservation at ${options.restaurantName} (Booking #${options.bookingId})`,
    order_id: options.orderId,
    prefill: {
      name: options.customerName || '',
      email: options.customerEmail || '',
      contact: options.customerPhone || '',
    },
    notes: {
      bookingId: options.bookingId,
      restaurant: options.restaurantName,
    },
    theme: {
      color: '#25152F', // Midnight Plum brand color
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss();
      },
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      try {
        // ALWAYS verify signature on backend — never trust frontend callback alone
        const verification = await verifyPaymentOnBackend({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          bookingId: options.bookingId,
          amount: options.amountInPaise / 100,
        });

        if (verification.verified && verification.status === 'SUCCESS') {
          options.onSuccess(verification);
        } else {
          options.onFailure(verification.message || 'Payment verification failed on the server.');
        }
      } catch (err: any) {
        options.onFailure(err?.message || 'Server error verifying payment.');
      }
    },
  };

  const rzpInstance = new (window as any).Razorpay(razorpayOptions);
  rzpInstance.on('payment.failed', (failResponse: any) => {
    options.onFailure(failResponse?.error?.description || 'Payment was declined or failed.');
  });
  rzpInstance.open();
}
