import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Booking, Restaurant } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  calculateUpiCommissionSplit,
  generateUpiDeepLink,
  maskUpiId,
} from '../../utils/cancellationAndPricing';

interface Props {
  booking: Booking | null;
  restaurant?: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (bookingId: string, method: string, upiApp?: 'gpay' | 'phonepe' | 'custom_upi') => void;
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
  const rawOwnerUpiId = matchedRestaurant?.upiId?.trim() || 'shop.merchant@upi';

  // Mode selection: 'gpay' | 'phonepe' | 'custom_upi'
  const [selectedUpiMode, setSelectedUpiMode] = useState<'gpay' | 'phonepe' | 'custom_upi'>('gpay');
  const [customVpa, setCustomVpa] = useState('');
  const [agreedToCancellationPolicy, setAgreedToCancellationPolicy] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCount, setRedirectCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsRedirecting(false);
      setIsProcessing(false);
      setShowQrCode(false);
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const policy = booking.cancellationPolicySnapshot;
  const advanceToPay = booking.advanceAmount;

  // Compute 98% merchant payout vs 2% admin facilitation fee
  const split = calculateUpiCommissionSplit(advanceToPay, rawOwnerUpiId);

  // Generate UPI Deep Link URL for direct payment
  const gpayDeepLink = generateUpiDeepLink({
    payeeUpi: rawOwnerUpiId,
    payeeName: booking.restaurantName,
    amount: advanceToPay,
    transactionNote: `Table Pre-Booking #${booking.id}`,
    app: 'gpay',
  });

  const phonepeDeepLink = generateUpiDeepLink({
    payeeUpi: rawOwnerUpiId,
    payeeName: booking.restaurantName,
    amount: advanceToPay,
    transactionNote: `Table Pre-Booking #${booking.id}`,
    app: 'phonepe',
  });

  const genericDeepLink = generateUpiDeepLink({
    payeeUpi: rawOwnerUpiId,
    payeeName: booking.restaurantName,
    amount: advanceToPay,
    transactionNote: `Table Pre-Booking #${booking.id}`,
    app: 'generic',
  });

  // Handle direct payment trigger (Google Pay / PhonePe)
  const handleInitiatePayment = (app: 'gpay' | 'phonepe' | 'custom_upi') => {
    if (!agreedToCancellationPolicy) {
      setError('Please review and agree to the venue cancellation policy to proceed.');
      return;
    }

    if (app === 'custom_upi' && !customVpa.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. yourname@upi).');
      return;
    }

    setError('');
    setIsRedirecting(true);
    setRedirectCount((c) => c + 1);

    const targetUrl = app === 'gpay' ? gpayDeepLink : app === 'phonepe' ? phonepeDeepLink : genericDeepLink;

    // Trigger mobile browser intent / deep link directly
    try {
      window.location.href = targetUrl;
    } catch {
      // Ignore if browser restricts custom scheme navigation
    }

    // Simultaneously present confirmation flow
  };

  // Confirm payment completed
  const handleConfirmPaymentDone = (app: 'gpay' | 'phonepe' | 'custom_upi') => {
    if (!agreedToCancellationPolicy) {
      setError('Please agree to the venue cancellation policy to proceed.');
      return;
    }

    setIsProcessing(true);
    setError('');

    setTimeout(() => {
      setIsProcessing(false);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });

      const label =
        app === 'gpay'
          ? 'Google Pay (UPI)'
          : app === 'phonepe'
          ? 'PhonePe (UPI)'
          : 'Direct UPI Pay';

      onPaymentSuccess(booking.id, label, app);
      onClose();
    }, 1100);
  };

  // Dynamic QR Code SVG for scan-to-pay
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    genericDeepLink
  )}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* UPI Brand Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight font-display flex items-center gap-1.5">
                <span>Direct UPI Instant Pay</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-500/30">
                  NPCI 256-Bit
                </span>
              </div>
              <div className="text-[11px] text-stone-300">
                To: {booking.restaurantName} (Verified Merchant)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close payment modal"
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Settlement Header */}
        <div className="px-6 py-4 bg-[#FCE8EF]/50 border-b border-[#E8A0B5]/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
              Advance Due Now (50%)
            </span>
            <div className="text-3xl font-extrabold font-mono text-[#34343A]">₹{advanceToPay}</div>
          </div>
          <div className="text-right text-xs">
            <span className="text-stone-400 font-medium">Total Dining Bill</span>
            <div className="font-bold text-stone-800 text-sm">₹{booking.totalAmount}</div>
            <div className="text-[11px] text-[#C96884] font-medium">
              Remaining ₹{booking.remainingAmount} after meal
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Direct UPI Payment Mode Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-800">
                Select Direct UPI App / Mode:
              </label>
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className="text-[11px] text-[#C96884] hover:text-stone-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQrCode ? 'Hide QR Code' : 'Scan QR Code'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Option 1: Google Pay */}
              <button
                type="button"
                onClick={() => {
                  setSelectedUpiMode('gpay');
                  setError('');
                }}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedUpiMode === 'gpay'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-xs ring-1 ring-blue-500/40'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700 font-medium'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-2xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span className="text-xs">Google Pay</span>
              </button>

              {/* Option 2: PhonePe */}
              <button
                type="button"
                onClick={() => {
                  setSelectedUpiMode('phonepe');
                  setError('');
                }}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedUpiMode === 'phonepe'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold shadow-xs ring-1 ring-purple-500/40'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700 font-medium'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-extrabold text-sm shadow-2xs">
                  पे
                </div>
                <span className="text-xs">PhonePe</span>
              </button>

              {/* Option 3: Add UPI / Other App */}
              <button
                type="button"
                onClick={() => {
                  setSelectedUpiMode('custom_upi');
                  setError('');
                }}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedUpiMode === 'custom_upi'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500/40'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700 font-medium'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs font-bold text-xs">
                  <Smartphone className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-xs">Add UPI ID</span>
              </button>
            </div>
          </div>

          {/* QR Code Section (Optional view or desktop scan) */}
          {showQrCode && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2 animate-in fade-in">
              <div className="text-xs font-bold text-stone-800 flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#C96884]" />
                <span>Scan with Any UPI App (GPay / PhonePe / Paytm)</span>
              </div>
              <div className="inline-block p-2 bg-white rounded-2xl shadow-xs border border-stone-200">
                <img
                  src={qrSvgUrl}
                  alt="UPI QR Code"
                  className="w-40 h-40 object-contain mx-auto"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Amount: <strong className="text-stone-900 font-mono">₹{advanceToPay}</strong> · Instant bank settlement
              </p>
            </div>
          )}

          {/* Mode Details Card */}
          {selectedUpiMode === 'gpay' && (
            <div className="p-4 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/40 rounded-2xl border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white border border-blue-200 flex items-center justify-center shadow-2xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-950">Pay via Google Pay App</div>
                    <div className="text-[11px] text-blue-700">Direct merchant bank settlement</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  Instant Deep Link
                </span>
              </div>

              <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100 text-[11px] text-stone-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Merchant Direct Credit (98%):</span>
                  <span className="font-bold text-stone-900 font-mono">₹{split.merchantPayout.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-500">
                  <span>Platform Guarantee & Facilitation (2%):</span>
                  <span className="font-mono">₹{split.adminCommission.toFixed(2)}</span>
                </div>
                <div className="pt-1 border-t border-stone-100 flex items-center justify-between font-bold text-stone-900">
                  <span>Total Debit from Your Account:</span>
                  <span className="font-mono text-blue-700">₹{advanceToPay.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={gpayDeepLink}
                  onClick={() => handleInitiatePayment('gpay')}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch Google Pay App</span>
                </a>
              </div>
            </div>
          )}

          {selectedUpiMode === 'phonepe' && (
            <div className="p-4 bg-gradient-to-br from-purple-50/60 via-white to-purple-50/40 rounded-2xl border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#5f259f] text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">
                    पे
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-950">Pay via PhonePe App</div>
                    <div className="text-[11px] text-purple-700">Direct merchant bank settlement</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  Instant Deep Link
                </span>
              </div>

              <div className="p-2.5 bg-white/90 rounded-xl border border-purple-100 text-[11px] text-stone-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Merchant Direct Credit (98%):</span>
                  <span className="font-bold text-stone-900 font-mono">₹{split.merchantPayout.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-500">
                  <span>Platform Guarantee & Facilitation (2%):</span>
                  <span className="font-mono">₹{split.adminCommission.toFixed(2)}</span>
                </div>
                <div className="pt-1 border-t border-stone-100 flex items-center justify-between font-bold text-stone-900">
                  <span>Total Debit from Your Account:</span>
                  <span className="font-mono text-purple-700">₹{advanceToPay.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={phonepeDeepLink}
                  onClick={() => handleInitiatePayment('phonepe')}
                  className="flex-1 py-2.5 px-3 bg-[#5f259f] hover:bg-[#501c87] text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch PhonePe App</span>
                </a>
              </div>
            </div>
          )}

          {selectedUpiMode === 'custom_upi' && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800 block">
                  Add Your UPI ID (VPA)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customVpa}
                    onChange={(e) => setCustomVpa(e.target.value)}
                    placeholder="e.g. yourname@oksbi / yourname@paytm"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#E8A0B5] font-mono"
                  />
                </div>
                <p className="text-[10px] text-stone-400">
                  A direct UPI payment request of ₹{advanceToPay} will be routed to your UPI app.
                </p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Direct Merchant Settlement (98%):</span>
                  <span className="font-bold font-mono">₹{split.merchantPayout.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-500">
                  <span>Platform Fee (2%):</span>
                  <span className="font-mono">₹{split.adminCommission.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Guarantee Note (Ensuring no raw UPI ID is exposed) */}
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2 text-xs">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-950 leading-relaxed">
              <span className="font-bold">Privacy & Payment Route: </span>
              Payments are routed directly to {booking.restaurantName}'s bank account via encrypted UPI intent. Sensitive banking identifiers are masked and protected under NPCI compliance.
            </div>
          </div>

          {/* Transparent Cancellation Policy Agreement */}
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-amber-900">
                Venue Cancellation & Advance Guarantee
              </span>
            </div>
            <p className="text-[11px] text-amber-950 leading-relaxed">
              {policy.termsText}
            </p>
            <div className="text-[11px] text-amber-900 pt-1 border-t border-amber-200/60 flex items-center justify-between font-medium">
              <span>
                Policy:{' '}
                {policy.type === 'fixed'
                  ? `₹${policy.deductionValue} Fixed Charge`
                  : `${policy.deductionValue}% Deduction`}
              </span>
              <span>Min Charge: ₹{policy.minDeductionCharge}</span>
            </div>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToCancellationPolicy}
                onChange={(e) => setAgreedToCancellationPolicy(e.target.checked)}
                className="mt-0.5 rounded text-[#C96884] focus:ring-[#E8A0B5] w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-stone-900">
                I understand and agree to this venue's cancellation & deduction policy.
              </span>
            </label>
          </div>

          {/* Action Button: Confirm & Complete Payment */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleConfirmPaymentDone(selectedUpiMode)}
            className="w-full py-3.5 px-4 bg-[#34343A] hover:bg-[#232328] disabled:bg-stone-400 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying UPI Transaction...</span>
              </div>
            ) : (
              <>
                <span>
                  Confirm ₹{advanceToPay} Paid via{' '}
                  {selectedUpiMode === 'gpay'
                    ? 'Google Pay'
                    : selectedUpiMode === 'phonepe'
                    ? 'PhonePe'
                    : 'UPI'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Footer with Security Badges */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>NPCI Direct UPI Verified · Encrypted Payout</span>
          </div>
          <span className="font-mono text-[10px] text-stone-400">
            Split: 98% Merchant / 2% Platform
          </span>
        </div>
      </div>
    </div>
  );
};
