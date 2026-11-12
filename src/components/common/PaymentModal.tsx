import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  QrCode,
  Smartphone,
  Lock,
  Sparkles,
  Zap,
  RefreshCw,
  Clock,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Booking, Restaurant } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  calculateUpiCommissionSplit,
  generateUpiDeepLink,
} from '../../utils/cancellationAndPricing';
import {
  fetchPaymentConfig,
  createBackendPaymentOrder,
  verifyPaymentOnBackend,
  fetchDynamicUpiQr,
  requestUpiCollect,
  validateUpiIdFormat,
  openRazorpayCheckout,
  PaymentGatewayConfig,
  PaymentOrderResponse,
  VerificationResult,
} from '../../services/paymentService';

interface Props {
  booking: Booking | null;
  restaurant?: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (
    bookingId: string,
    method: string,
    upiApp?: 'gpay' | 'phonepe' | 'custom_upi',
    verifiedDetails?: { paymentId?: string; orderId?: string }
  ) => void;
}

export const PaymentModal: React.FC<Props> = ({
  booking,
  restaurant: propRestaurant,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const { restaurants } = useApp();

  // Find restaurant to obtain shop owner's UPI ID
  const matchedRestaurant = propRestaurant || restaurants.find((r) => r.id === booking?.restaurantId);
  const rawOwnerUpiId = matchedRestaurant?.upiId?.trim() || 'zaikya.merchant@okhdfcbank';

  // Config and Gateway State
  const [config, setConfig] = useState<PaymentGatewayConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Selected payment method / app
  const [selectedUpiMode, setSelectedUpiMode] = useState<
    'gpay' | 'phonepe' | 'paytm' | 'custom_upi' | 'qr'
  >('gpay');

  // Input states
  const [customVpa, setCustomVpa] = useState('');
  const [vpaError, setVpaError] = useState('');
  const [manualPaymentId, setManualPaymentId] = useState('');
  const [agreedToCancellationPolicy, setAgreedToCancellationPolicy] = useState(false);

  // Workflow states: 'IDLE' | 'CREATING_ORDER' | 'AWAITING_PAYMENT' | 'VERIFYING' | 'SUCCESS' | 'FAILED'
  const [paymentState, setPaymentState] = useState<
    'IDLE' | 'CREATING_ORDER' | 'AWAITING_PAYMENT' | 'VERIFYING' | 'SUCCESS' | 'FAILED'
  >('IDLE');

  const [activeOrder, setActiveOrder] = useState<PaymentOrderResponse | null>(null);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string | null>(null);
  const [qrExpirySeconds, setQrExpirySeconds] = useState(900); // 15 mins
  const [collectNotice, setCollectNotice] = useState<{ type: 'info' | 'error' | 'success'; message: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedDetails, setVerifiedDetails] = useState<{ paymentId: string; orderId: string } | null>(null);

  // Timer reference for QR countdown
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch payment gateway configuration when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingConfig(true);
      setErrorMessage('');
      setPaymentState('IDLE');
      setActiveOrder(null);
      setDynamicQrDataUrl(null);
      setCollectNotice(null);
      setVerifiedDetails(null);
      setManualPaymentId('');

      fetchPaymentConfig()
        .then((cfg) => {
          setConfig(cfg);
        })
        .catch(() => {
          setConfig({
            isConfigured: false,
            keyId: null,
            merchantName: 'ZAikya Hyperlocal Dining',
            currency: 'INR',
            message: 'Online payments are currently unavailable. No money has been charged.',
          });
        })
        .finally(() => {
          setIsLoadingConfig(false);
        });
    }
  }, [isOpen]);

  // QR Code Expiry Countdown
  useEffect(() => {
    if (paymentState === 'AWAITING_PAYMENT' && dynamicQrDataUrl && qrExpirySeconds > 0) {
      timerRef.current = setInterval(() => {
        setQrExpirySeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paymentState, dynamicQrDataUrl, qrExpirySeconds]);

  if (!isOpen || !booking) return null;

  const policy = booking.cancellationPolicySnapshot;
  const advanceToPay = booking.advanceAmount;

  // Split: 98% merchant, 2% platform
  const split = calculateUpiCommissionSplit(advanceToPay, rawOwnerUpiId);

  // Format countdown minutes:seconds
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper to ensure order exists before proceeding
  const ensureOrderCreated = async (): Promise<PaymentOrderResponse | null> => {
    if (activeOrder && activeOrder.orderId) return activeOrder;
    setPaymentState('CREATING_ORDER');
    setStatusMessage('Initiating secure transaction order on server...');
    setErrorMessage('');

    try {
      const order = await createBackendPaymentOrder({
        bookingId: booking.id,
        amount: advanceToPay,
        restaurantName: booking.restaurantName,
        customerName: booking.customerName || 'ZAikya Guest',
        customerPhone: booking.customerPhone || '9876543210',
        customerEmail: booking.customerEmail || 'guest@zaikya.app',
        paymentType: 'ADVANCE',
      });

      if (!order.success || !order.orderId) {
        throw new Error(order.message || 'Failed to initialize payment order on gateway.');
      }

      setActiveOrder(order);
      return order;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create payment order.';
      setErrorMessage(msg);
      setPaymentState('FAILED');
      return null;
    }
  };

  // 1. Google Pay Intent Flow
  const handlePayViaGooglePay = async () => {
    if (!agreedToCancellationPolicy) {
      setErrorMessage('Please review and agree to the venue cancellation policy to proceed.');
      return;
    }
    setErrorMessage('');
    const order = await ensureOrderCreated();
    if (!order || !order.orderId) return;

    setPaymentState('AWAITING_PAYMENT');
    setStatusMessage('Opening Google Pay UPI Intent...');

    // Generate deep link
    const gpayLink = generateUpiDeepLink({
      payeeUpi: rawOwnerUpiId,
      payeeName: booking.restaurantName,
      amount: advanceToPay,
      transactionNote: `ZAikya Booking #${booking.id}`,
      app: 'gpay',
    });

    // Try launching intent
    try {
      window.location.href = gpayLink;
    } catch {}

    // Also offer standard Razorpay UPI modal if configured
    if (config?.isConfigured && config.keyId) {
      openRazorpayCheckout({
        orderId: order.orderId,
        keyId: config.keyId,
        amountInPaise: Math.round(advanceToPay * 100),
        bookingId: booking.id,
        restaurantName: booking.restaurantName,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        onSuccess: (verifiedResult: VerificationResult) => {
          setPaymentState('SUCCESS');
          setVerifiedDetails({
            paymentId: verifiedResult.transactionId || 'pay_verified',
            orderId: verifiedResult.orderId || order.orderId || '',
          });
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          onPaymentSuccess(booking.id, 'Google Pay (UPI)', 'gpay', {
            paymentId: verifiedResult.transactionId,
            orderId: verifiedResult.orderId,
          });
        },
        onFailure: (errorMsg: string) => {
          setPaymentState('FAILED');
          setErrorMessage(errorMsg || 'Payment was cancelled or failed in Google Pay.');
        },
      });
    }
  };

  // 2. PhonePe Intent Flow
  const handlePayViaPhonePe = async () => {
    if (!agreedToCancellationPolicy) {
      setErrorMessage('Please review and agree to the venue cancellation policy to proceed.');
      return;
    }
    setErrorMessage('');
    const order = await ensureOrderCreated();
    if (!order || !order.orderId) return;

    setPaymentState('AWAITING_PAYMENT');
    setStatusMessage('Opening PhonePe UPI Intent...');

    const phonepeLink = generateUpiDeepLink({
      payeeUpi: rawOwnerUpiId,
      payeeName: booking.restaurantName,
      amount: advanceToPay,
      transactionNote: `ZAikya Booking #${booking.id}`,
      app: 'phonepe',
    });

    try {
      window.location.href = phonepeLink;
    } catch {}

    if (config?.isConfigured && config.keyId) {
      openRazorpayCheckout({
        orderId: order.orderId,
        keyId: config.keyId,
        amountInPaise: Math.round(advanceToPay * 100),
        bookingId: booking.id,
        restaurantName: booking.restaurantName,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        onSuccess: (verifiedResult: VerificationResult) => {
          setPaymentState('SUCCESS');
          setVerifiedDetails({
            paymentId: verifiedResult.transactionId || 'pay_verified',
            orderId: verifiedResult.orderId || order.orderId || '',
          });
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          onPaymentSuccess(booking.id, 'PhonePe (UPI)', 'phonepe', {
            paymentId: verifiedResult.transactionId,
            orderId: verifiedResult.orderId,
          });
        },
        onFailure: (errorMsg: string) => {
          setPaymentState('FAILED');
          setErrorMessage(errorMsg || 'Payment was cancelled or failed in PhonePe.');
        },
      });
    }
  };

  // 3. Paytm / Generic UPI Intent Flow
  const handlePayViaPaytm = async () => {
    if (!agreedToCancellationPolicy) {
      setErrorMessage('Please review and agree to the venue cancellation policy to proceed.');
      return;
    }
    setErrorMessage('');
    const order = await ensureOrderCreated();
    if (!order || !order.orderId) return;

    setPaymentState('AWAITING_PAYMENT');
    setStatusMessage('Opening Paytm / UPI Intent...');

    const upiLink = generateUpiDeepLink({
      payeeUpi: rawOwnerUpiId,
      payeeName: booking.restaurantName,
      amount: advanceToPay,
      transactionNote: `ZAikya Booking #${booking.id}`,
      app: 'generic',
    });

    try {
      window.location.href = upiLink;
    } catch {}

    if (config?.isConfigured && config.keyId) {
      openRazorpayCheckout({
        orderId: order.orderId,
        keyId: config.keyId,
        amountInPaise: Math.round(advanceToPay * 100),
        bookingId: booking.id,
        restaurantName: booking.restaurantName,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        onSuccess: (verifiedResult: VerificationResult) => {
          setPaymentState('SUCCESS');
          setVerifiedDetails({
            paymentId: verifiedResult.transactionId || 'pay_verified',
            orderId: verifiedResult.orderId || order.orderId || '',
          });
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          onPaymentSuccess(booking.id, 'Paytm (UPI)', 'gpay', {
            paymentId: verifiedResult.transactionId,
            orderId: verifiedResult.orderId,
          });
        },
        onFailure: (errorMsg: string) => {
          setPaymentState('FAILED');
          setErrorMessage(errorMsg || 'Payment was cancelled or failed in Paytm.');
        },
      });
    }
  };

  // 4. Dynamic QR Code generation
  const handleGenerateDynamicQr = async () => {
    if (!agreedToCancellationPolicy) {
      setErrorMessage('Please review and agree to the venue cancellation policy to proceed.');
      return;
    }
    setErrorMessage('');
    const order = await ensureOrderCreated();
    if (!order || !order.orderId) return;

    setPaymentState('AWAITING_PAYMENT');
    setStatusMessage('Generating dynamic booking QR code...');

    try {
      const qrRes = await fetchDynamicUpiQr({
        bookingId: booking.id,
        amount: advanceToPay,
        restaurantName: booking.restaurantName,
        payeeUpi: rawOwnerUpiId,
      });

      if (qrRes.qrCodeDataUrl) {
        setDynamicQrDataUrl(qrRes.qrCodeDataUrl);
      }
      setQrExpirySeconds(900); // 15 mins
      setStatusMessage('Scan QR using any UPI app to complete payment');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate dynamic QR code.';
      setErrorMessage(msg);
      setPaymentState('FAILED');
    }
  };

  // 5. UPI ID / VPA Collect Request
  const handleRequestUpiCollect = async () => {
    if (!agreedToCancellationPolicy) {
      setErrorMessage('Please review and agree to the venue cancellation policy to proceed.');
      return;
    }
    const validation = validateUpiIdFormat(customVpa);
    if (!validation.isValid) {
      setVpaError(validation.error || 'Please enter a valid UPI ID (e.g. yourname@okhdfcbank)');
      return;
    }
    setVpaError('');
    setErrorMessage('');
    setCollectNotice(null);

    const order = await ensureOrderCreated();
    if (!order || !order.orderId) return;

    setPaymentState('AWAITING_PAYMENT');
    setStatusMessage(`Sending payment collect request to ${customVpa}...`);

    try {
      const collectRes = await requestUpiCollect({
        bookingId: booking.id,
        upiId: customVpa.trim(),
        amount: advanceToPay,
        restaurantName: booking.restaurantName,
      });

      if (collectRes.success && collectRes.collectSupported) {
        setCollectNotice({
          type: 'success',
          message: `Collect request sent to ${customVpa}. Open your UPI app and approve ₹${advanceToPay}.`,
        });
      } else {
        // Collect not supported by merchant tier; gracefully redirect to QR / Intent
        setCollectNotice({
          type: 'info',
          message:
            collectRes.message ||
            'Direct UPI collect requests are restricted on this merchant account. Please scan the Dynamic QR code or use Google Pay / PhonePe directly.',
        });
        // Automatically generate dynamic QR as immediate fallback
        handleGenerateDynamicQr();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'UPI collect request failed.';
      setErrorMessage(msg);
      setPaymentState('FAILED');
    }
  };

  // 6. Complete Verification on Backend
  const verifyAndFinalizePayment = async (
    paymentId: string,
    orderId: string,
    signature = '',
    method = 'UPI',
    upiApp: 'gpay' | 'phonepe' | 'custom_upi' = 'gpay'
  ) => {
    setPaymentState('VERIFYING');
    setStatusMessage('Verifying payment signature with banking gateway...');
    setErrorMessage('');

    try {
      const verifyRes = await verifyPaymentOnBackend({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        bookingId: booking.id,
        amount: advanceToPay,
      });

      if (verifyRes.verified && verifyRes.status === 'SUCCESS') {
        setPaymentState('SUCCESS');
        const resolvedTxnId = verifyRes.transactionId || paymentId;
        const resolvedOrderId = verifyRes.orderId || orderId;
        setVerifiedDetails({ paymentId: resolvedTxnId, orderId: resolvedOrderId });
        setStatusMessage('Payment verified successfully!');

        // Trigger celebratory confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Notify parent application
        onPaymentSuccess(booking.id, method, upiApp, {
          paymentId: resolvedTxnId,
          orderId: resolvedOrderId,
        });
      } else {
        setPaymentState('FAILED');
        setErrorMessage(verifyRes.message || 'Payment verification failed with the bank gateway.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server error during payment verification.';
      setPaymentState('FAILED');
      setErrorMessage(msg);
    }
  };

  // Manual transaction ID verification fallback (e.g. after customer scans QR)
  const handleVerifyManualTxn = async () => {
    if (!manualPaymentId.trim()) {
      setErrorMessage('Please enter the UPI Reference ID (UTR / Transaction ID) from your payment app.');
      return;
    }
    if (!activeOrder || !activeOrder.orderId) {
      setErrorMessage('No active order found. Please regenerate order.');
      return;
    }
    await verifyAndFinalizePayment(
      manualPaymentId.trim(),
      activeOrder.orderId,
      '',
      'Dynamic UPI QR',
      selectedUpiMode === 'custom_upi' ? 'custom_upi' : 'gpay'
    );
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && paymentState !== 'VERIFYING' && paymentState !== 'CREATING_ORDER') {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-[#F7F2EA] rounded-3xl shadow-2xl border border-[#DDD4E2] overflow-hidden my-4 flex flex-col max-h-[94vh]">
        {/* Header - Midnight Garden Plum & Cream */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#25152F] text-[#F7F2EA]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#A8B88A] flex items-center justify-center font-bold text-[#25152F] shadow-xs">
              <Zap className="w-5 h-5 text-[#25152F]" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight font-display flex items-center gap-2">
                <span>ZAikya Instant UPI Pay</span>
                <span className="px-1.5 py-0.5 bg-[#A8B88A]/20 text-[#A8B88A] text-[10px] font-bold rounded border border-[#A8B88A]/30">
                  Razorpay Verified
                </span>
              </div>
              <div className="text-[11px] text-[#DDD4E2]/80">
                To: {booking.restaurantName} · Advance Table Reservation
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={paymentState === 'VERIFYING' || paymentState === 'CREATING_ORDER'}
            aria-label="Close payment modal"
            className="p-1.5 rounded-xl text-[#DDD4E2] hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Due Breakdown Banner */}
        <div className="px-6 py-3.5 bg-white border-b border-[#DDD4E2] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5A4B63] uppercase tracking-wider block">
              Advance Payable Now ({booking.advancePercentage || 50}%)
            </span>
            <div className="text-3xl font-extrabold font-mono text-[#25152F]">
              ₹{advanceToPay.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-[#5A4B63] font-medium">Total Dining Bill</span>
            <div className="font-bold text-[#25152F] text-sm">₹{booking.totalAmount.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-[#B96D79] font-bold">
              Remaining ₹{booking.remainingAmount.toLocaleString('en-IN')} due after dining
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Loading Config Indicator */}
          {isLoadingConfig && (
            <div className="p-4 bg-white rounded-2xl border border-[#DDD4E2] flex items-center justify-center gap-3 text-xs text-[#25152F] font-semibold">
              <RefreshCw className="w-4 h-4 text-[#A8B88A] animate-spin" />
              <span>Connecting to secure payment gateway...</span>
            </div>
          )}

          {/* UNCONFIGURED GATEWAY BANNER (Explicit Requirement) */}
          {!isLoadingConfig && config && !config.isConfigured && (
            <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Gateway Configuration Notice
                  </h4>
                  <p className="text-sm font-extrabold text-amber-900 mt-0.5">
                    Online payments are currently unavailable. No money has been charged.
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-amber-950 leading-relaxed pl-7 space-y-1">
                <p>
                  The merchant payment gateway credentials (<code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">RAZORPAY_KEY_ID</code> / <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">RAZORPAY_KEY_SECRET</code>) have not yet been activated on this environment.
                </p>
                <p className="text-amber-800 font-medium">
                  ZAikya guarantees no mock or unverified payments are processed. Please contact the restaurant or administrator to enable live or test gateway credentials.
                </p>
              </div>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMessage}</span>
                {paymentState === 'FAILED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setPaymentState('IDLE');
                    }}
                    className="block mt-1.5 text-[11px] font-bold text-rose-900 underline cursor-pointer"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Collect Notice (Info / Warning / Success) */}
          {collectNotice && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                collectNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#25152F]" />
              <div className="flex-1 leading-relaxed">{collectNotice.message}</div>
            </div>
          )}

          {/* Status message when creating order or waiting */}
          {paymentState !== 'IDLE' && paymentState !== 'FAILED' && (
            <div className="p-3 bg-white rounded-2xl border border-[#DDD4E2] flex items-center gap-2.5 text-xs text-[#25152F] font-bold">
              {paymentState === 'VERIFYING' || paymentState === 'CREATING_ORDER' ? (
                <div className="w-4 h-4 border-2 border-[#25152F] border-t-transparent rounded-full animate-spin shrink-0" />
              ) : paymentState === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-[#B96D79] shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* SUCCESS VIEW */}
          {paymentState === 'SUCCESS' && (
            <div className="p-5 bg-white rounded-3xl border border-emerald-200 text-center space-y-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#25152F]">Payment Verified Successfully!</h3>
                <p className="text-xs text-[#5A4B63] mt-0.5">
                  Your table reservation at {booking.restaurantName} is now confirmed.
                </p>
              </div>

              {verifiedDetails && (
                <div className="p-3 bg-[#F7F2EA] rounded-2xl text-[11px] font-mono text-[#25152F] text-left space-y-1 border border-[#DDD4E2]">
                  <div className="flex justify-between">
                    <span className="text-[#5A4B63]">Payment Ref:</span>
                    <span className="font-bold">{verifiedDetails.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A4B63]">Order ID:</span>
                    <span className="font-bold">{verifiedDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A4B63]">Amount Paid:</span>
                    <span className="font-bold text-emerald-700">₹{advanceToPay.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#25152F] hover:bg-[#1A0F21] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Close &amp; View Confirmed Booking
              </button>
            </div>
          )}

          {/* ACTIVE PAYMENT SELECTION VIEW (When not in success) */}
          {paymentState !== 'SUCCESS' && (
            <>
              {/* Payment Methods Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#25152F] block">
                  Select Real UPI Payment Method:
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {/* Option 1: Google Pay */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUpiMode('gpay');
                      setErrorMessage('');
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedUpiMode === 'gpay'
                        ? 'border-[#25152F] bg-white text-[#25152F] font-bold shadow-xs ring-2 ring-[#A8B88A]'
                        : 'border-[#DDD4E2] bg-white/70 hover:bg-white text-[#5A4B63] font-medium'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#DDD4E2] flex items-center justify-center shadow-2xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    <span className="text-[11px] truncate w-full">GPay</span>
                  </button>

                  {/* Option 2: PhonePe */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUpiMode('phonepe');
                      setErrorMessage('');
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedUpiMode === 'phonepe'
                        ? 'border-[#25152F] bg-white text-[#25152F] font-bold shadow-xs ring-2 ring-[#A8B88A]'
                        : 'border-[#DDD4E2] bg-white/70 hover:bg-white text-[#5A4B63] font-medium'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">
                      पे
                    </div>
                    <span className="text-[11px] truncate w-full">PhonePe</span>
                  </button>

                  {/* Option 3: Paytm */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUpiMode('paytm');
                      setErrorMessage('');
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedUpiMode === 'paytm'
                        ? 'border-[#25152F] bg-white text-[#25152F] font-bold shadow-xs ring-2 ring-[#A8B88A]'
                        : 'border-[#DDD4E2] bg-white/70 hover:bg-white text-[#5A4B63] font-medium'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#002e6e] text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                      Paytm
                    </div>
                    <span className="text-[11px] truncate w-full">Paytm</span>
                  </button>

                  {/* Option 4: Dynamic QR */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUpiMode('qr');
                      setErrorMessage('');
                      if (!dynamicQrDataUrl) handleGenerateDynamicQr();
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedUpiMode === 'qr'
                        ? 'border-[#25152F] bg-white text-[#25152F] font-bold shadow-xs ring-2 ring-[#A8B88A]'
                        : 'border-[#DDD4E2] bg-white/70 hover:bg-white text-[#5A4B63] font-medium'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#A8B88A] text-[#25152F] flex items-center justify-center shadow-2xs font-bold text-xs">
                      <QrCode className="w-4 h-4 text-[#25152F]" />
                    </div>
                    <span className="text-[11px] truncate w-full">Scan QR</span>
                  </button>
                </div>

                {/* Sub-toggle for custom UPI ID */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUpiMode('custom_upi');
                      setErrorMessage('');
                    }}
                    className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      selectedUpiMode === 'custom_upi' ? 'text-[#25152F] underline' : 'text-[#5A4B63] hover:text-[#25152F]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Enter UPI ID (VPA) manually</span>
                  </button>
                </div>
              </div>

              {/* SECTION: Google Pay Details */}
              {selectedUpiMode === 'gpay' && (
                <div className="p-4 bg-white rounded-2xl border border-[#DDD4E2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#25152F]">Pay via Google Pay App</div>
                        <div className="text-[11px] text-[#5A4B63]">UPI Intent &amp; Verified Settlement</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A8B88A]/20 text-[#25152F] border border-[#A8B88A]/40">
                      Zero Surcharge
                    </span>
                  </div>

                  <p className="text-xs text-[#5A4B63] leading-relaxed">
                    Clicking initiate will create a secure order on our backend and launch Google Pay with the exact amount of ₹{advanceToPay}.
                  </p>

                  <button
                    type="button"
                    disabled={!config?.isConfigured || paymentState === 'CREATING_ORDER' || paymentState === 'VERIFYING'}
                    onClick={handlePayViaGooglePay}
                    className="w-full py-3 bg-[#4285F4] hover:bg-[#3367d6] disabled:bg-stone-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Google Pay to Authorize ₹{advanceToPay}</span>
                  </button>
                </div>
              )}

              {/* SECTION: PhonePe Details */}
              {selectedUpiMode === 'phonepe' && (
                <div className="p-4 bg-white rounded-2xl border border-[#DDD4E2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-[#5f259f]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#25152F]">Pay via PhonePe App</div>
                        <div className="text-[11px] text-[#5A4B63]">Instant UPI Intent Routing</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A8B88A]/20 text-[#25152F] border border-[#A8B88A]/40">
                      Zero Surcharge
                    </span>
                  </div>

                  <p className="text-xs text-[#5A4B63] leading-relaxed">
                    Pre-fills restaurant merchant details and ₹{advanceToPay} advance in your PhonePe application.
                  </p>

                  <button
                    type="button"
                    disabled={!config?.isConfigured || paymentState === 'CREATING_ORDER' || paymentState === 'VERIFYING'}
                    onClick={handlePayViaPhonePe}
                    className="w-full py-3 bg-[#5f259f] hover:bg-[#4a1c7c] disabled:bg-stone-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch PhonePe to Authorize ₹{advanceToPay}</span>
                  </button>
                </div>
              )}

              {/* SECTION: Paytm Details */}
              {selectedUpiMode === 'paytm' && (
                <div className="p-4 bg-white rounded-2xl border border-[#DDD4E2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-[#002e6e]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#25152F]">Pay via Paytm App</div>
                        <div className="text-[11px] text-[#5A4B63]">UPI &amp; Paytm Wallet / Bank</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A8B88A]/20 text-[#25152F] border border-[#A8B88A]/40">
                      Direct Routing
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!config?.isConfigured || paymentState === 'CREATING_ORDER' || paymentState === 'VERIFYING'}
                    onClick={handlePayViaPaytm}
                    className="w-full py-3 bg-[#002e6e] hover:bg-[#001d46] disabled:bg-stone-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Paytm to Authorize ₹{advanceToPay}</span>
                  </button>
                </div>
              )}

              {/* SECTION: Scan Dynamic QR Code */}
              {selectedUpiMode === 'qr' && (
                <div className="p-4 bg-white rounded-2xl border border-[#DDD4E2] text-center space-y-3">
                  <div className="flex items-center justify-between text-left">
                    <div>
                      <div className="text-xs font-bold text-[#25152F]">Dynamic Booking-Specific QR</div>
                      <div className="text-[11px] text-[#5A4B63]">Scan with GPay, PhonePe, Paytm, or BHIM</div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-[#B96D79] font-bold bg-[#FCE8EF] px-2 py-0.5 rounded-md border border-[#B96D79]/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(qrExpirySeconds)}</span>
                    </div>
                  </div>

                  {dynamicQrDataUrl ? (
                    <div className="inline-block p-3 bg-white rounded-2xl shadow-xs border-2 border-[#25152F]">
                      <img
                        src={dynamicQrDataUrl}
                        alt="Dynamic Booking QR"
                        className="w-44 h-44 object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 mx-auto bg-stone-100 rounded-2xl flex items-center justify-center text-xs text-stone-500">
                      Generating secure QR...
                    </div>
                  )}

                  <div className="text-xs text-[#25152F] font-mono font-bold">
                    Amount: ₹{advanceToPay} · Merchant: {rawOwnerUpiId}
                  </div>

                  {/* Manual verification after QR scan */}
                  <div className="pt-2 border-t border-[#DDD4E2] space-y-2 text-left">
                    <label className="text-[11px] font-bold text-[#25152F] block">
                      Paid via QR? Enter UPI Reference / UTR Number:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualPaymentId}
                        onChange={(e) => setManualPaymentId(e.target.value)}
                        placeholder="e.g. 432109876543 or pay_..."
                        className="flex-1 px-3 py-2 text-xs bg-white border border-[#DDD4E2] rounded-xl font-mono text-[#25152F] placeholder:text-[#5A4B63] focus:outline-none focus:border-[#25152F]"
                      />
                      <button
                        type="button"
                        disabled={paymentState === 'VERIFYING'}
                        onClick={handleVerifyManualTxn}
                        className="px-3.5 py-2 bg-[#A8B88A] hover:bg-[#97A779] text-[#25152F] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: Custom UPI ID (VPA) */}
              {selectedUpiMode === 'custom_upi' && (
                <div className="p-4 bg-white rounded-2xl border border-[#DDD4E2] space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#25152F] block">
                      Enter Customer UPI ID (VPA)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customVpa}
                        onChange={(e) => {
                          setCustomVpa(e.target.value);
                          if (vpaError) setVpaError('');
                        }}
                        placeholder="e.g. yourname@okhdfcbank or yourname@paytm"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border-2 border-[#DDD4E2] focus:border-[#25152F] rounded-xl text-[#25152F] font-mono font-bold placeholder:text-[#5A4B63] focus:outline-none"
                      />
                    </div>
                    {vpaError && <p className="text-[11px] text-rose-600 font-semibold">{vpaError}</p>}
                    <p className="text-[11px] text-[#5A4B63]">
                      A real UPI collect request of ₹{advanceToPay} will be initiated with your payment service provider.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!config?.isConfigured || paymentState === 'CREATING_ORDER' || paymentState === 'VERIFYING'}
                    onClick={handleRequestUpiCollect}
                    className="w-full py-3 bg-[#25152F] hover:bg-[#1A0F21] disabled:bg-stone-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Request UPI Collect (₹{advanceToPay})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Settlement Transparency (98% Merchant / 2% Platform) */}
              <div className="p-3 bg-white rounded-2xl border border-[#DDD4E2] text-[11px] space-y-1">
                <div className="flex items-center justify-between text-[#5A4B63]">
                  <span>Direct Merchant Settlement (98%):</span>
                  <span className="font-mono font-bold text-[#25152F]">₹{split.merchantPayout.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[#5A4B63]">
                  <span>Platform Guarantee &amp; Facilitation (2%):</span>
                  <span className="font-mono">₹{split.adminCommission.toFixed(2)}</span>
                </div>
                <div className="pt-1 border-t border-stone-100 flex items-center justify-between font-bold text-[#25152F]">
                  <span>Net Advance Due from Account:</span>
                  <span className="font-mono text-[#B96D79]">₹{advanceToPay.toFixed(2)}</span>
                </div>
              </div>

              {/* Cancellation Policy Acknowledgment */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-bold text-amber-950">
                    Venue Cancellation &amp; Advance Guarantee
                  </span>
                </div>
                <p className="text-[11px] text-amber-950 leading-relaxed">
                  {policy.termsText}
                </p>
                <div className="text-[11px] text-amber-900 pt-1 border-t border-amber-200/60 flex items-center justify-between font-medium">
                  <span>
                    Policy:{' '}
                    {policy.type === 'fixed'
                      ? `₹${policy.deductionValue} Fixed Deduction`
                      : `${policy.deductionValue}% Deduction`}
                  </span>
                  <span>Min Charge: ₹{policy.minDeductionCharge}</span>
                </div>

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToCancellationPolicy}
                    onChange={(e) => {
                      setAgreedToCancellationPolicy(e.target.checked);
                      if (errorMessage.includes('cancellation policy')) setErrorMessage('');
                    }}
                    className="mt-0.5 rounded text-[#25152F] focus:ring-[#A8B88A] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#25152F]">
                    I understand and agree to {booking.restaurantName}'s cancellation &amp; refund policy.
                  </span>
                </label>
              </div>

              {/* Security Compliance Footer */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2 text-xs">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-950 leading-relaxed">
                  <span className="font-bold">NPCI &amp; RBI Compliance: </span>
                  ZAikya never requests, sees, or stores your UPI PIN or banking passwords. All payments are verified securely on server using HMAC SHA-256 signatures.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-[#DDD4E2] flex items-center justify-between text-[11px] text-[#5A4B63]">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit Encrypted Payment Route</span>
          </div>
          <span className="font-mono text-[10px] text-[#5A4B63]">
            {config?.isConfigured ? 'Gateway: Active' : 'Gateway: Unconfigured'}
          </span>
        </div>
      </div>
    </div>
  );
};
