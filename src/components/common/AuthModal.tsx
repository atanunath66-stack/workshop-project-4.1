import React, { useState } from 'react';
import { X, ShieldCheck, Smartphone, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ConfirmationResult } from '../../lib/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, defaultRole = 'customer' }) => {
  const {
    authModalRole,
    setAuthModalRole,
    signInWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
    setIsAdminLoginModalOpen,
  } = useApp();

  const role = authModalRole || defaultRole;
  const [authMethod, setAuthMethod] = useState<'google' | 'phone'>('google');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [actionRequired, setActionRequired] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Clean up reCAPTCHA verifier on modal unmount
  React.useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch {}
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleGoogleClick = async (forceRedirect: boolean = false) => {
    setError(null);
    setErrorCode(null);
    setActionRequired(null);
    setIsGoogleLoading(true);
    try {
      const res = await signInWithGoogle(role, forceRedirect);
      if (!res.success && res.error) {
        setError(res.error);
      } else {
        onClose();
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setActionRequired(null);
    setSuccessMsg(null);

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      setErrorCode('auth/invalid-phone-number');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendPhoneOtp(cleanPhone, 'auth-recaptcha-container');
      if (res.success && res.confirmationResult) {
        setConfirmationResult(res.confirmationResult);
        setSuccessMsg(`OTP request sent to ${cleanPhone}. Please enter the 6-digit verification code below.`);
      } else {
        setError(res.error || 'Failed to send OTP. Please check your phone number.');
        setErrorCode(res.errorCode || null);
        setActionRequired(res.actionRequired || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Error initializing phone authentication.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    if (otp.trim().length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      setErrorCode('auth/invalid-verification-code');
      return;
    }

    setIsVerifyingOtp(true);
    setError(null);
    setErrorCode(null);
    setActionRequired(null);
    try {
      const res = await verifyPhoneOtp(confirmationResult, otp.trim(), role, fullName.trim() || undefined);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Verification failed. Please check the code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25152F]/70 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Invisible Recaptcha Anchor */}
      <div id="auth-recaptcha-container"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DDD4E2] overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDD4E2] bg-[#F7F2EA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#DDD4E2] flex items-center justify-center font-bold text-[#B96D79] shadow-2xs">
              <Sparkles className="w-5 h-5 text-[#B96D79]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#25152F] font-display">
                {role === 'customer'
                  ? 'Customer Sign In'
                  : role === 'owner'
                  ? 'Store Owner Sign In'
                  : 'Super Admin Access'}
              </h2>
              <p className="text-xs text-[#5A4B63]">
                {role === 'customer'
                  ? 'Sign in to pre-order dishes, book tables & earn rewards'
                  : role === 'owner'
                  ? 'Sign in to manage your stall, menu & live bookings'
                  : 'Master authorization for platform administration'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1.5 rounded-xl text-[#5A4B63] hover:text-[#25152F] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Toggle Selector */}
        <div className="p-1.5 bg-[#F7F2EA] border border-[#DDD4E2] mx-6 mt-5 rounded-2xl flex items-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthModalRole('customer');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              role === 'customer'
                ? 'bg-white text-[#25152F] font-bold shadow-xs border border-[#DDD4E2]'
                : 'text-[#5A4B63] hover:text-[#25152F]'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalRole('owner');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              role === 'owner'
                ? 'bg-white text-[#25152F] font-bold shadow-xs border border-[#DDD4E2]'
                : 'text-[#5A4B63] hover:text-[#25152F]'
            }`}
          >
            Store Owner
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              setIsAdminLoginModalOpen(true);
            }}
            className="flex-1 py-2 rounded-xl text-[#5A4B63] hover:text-[#25152F] transition-all cursor-pointer"
          >
            Super Admin
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1.5 leading-relaxed">
              <div className="font-bold text-rose-800 flex items-center justify-between">
                <span>{errorCode ? `Authentication Error (${errorCode})` : 'Authentication Error'}</span>
              </div>
              <p className="text-[#25152F] font-medium">{error}</p>
              {actionRequired && (
                <div className="p-2.5 bg-white/90 rounded-xl border border-rose-200 text-[11px] text-[#25152F] space-y-1">
                  <span className="font-bold text-[#B96D79] block">Firebase Console Requirement:</span>
                  <p className="text-[#5A4B63] leading-snug">{actionRequired}</p>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Authentication Method Tabs: Option A vs Option B */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F2EA] border border-[#DDD4E2] rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('google');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMethod === 'google'
                  ? 'bg-white text-[#25152F] font-bold shadow-xs border border-[#DDD4E2]'
                  : 'text-[#5A4B63] hover:text-[#25152F]'
              }`}
            >
              <span>Option A: Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMethod === 'phone'
                  ? 'bg-white text-[#25152F] font-bold shadow-xs border border-[#DDD4E2]'
                  : 'text-[#5A4B63] hover:text-[#25152F]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#B96D79]" />
              <span>Option B: Phone OTP</span>
            </button>
          </div>

          {/* OPTION A: Google OAuth */}
          {authMethod === 'google' && (
            <div className="space-y-4 pt-1">
              <p className="text-xs text-[#5A4B63] leading-relaxed">
                One-click verified login via Google OAuth. Automatically creates and links your {role === 'owner' ? 'Store Owner' : 'Customer'} profile in the database.
              </p>

              <button
                type="button"
                onClick={() => handleGoogleClick(false)}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-[#DDD4E2] hover:bg-[#F7F2EA] hover:border-[#A8B88A] rounded-2xl text-sm font-bold text-[#25152F] shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{isGoogleLoading ? 'Connecting to Google...' : `Continue with Google as ${role === 'owner' ? 'Store Owner' : 'Customer'}`}</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-[#5A4B63] px-1 pt-1">
                <span>Popup blocked or on Safari?</span>
                <button
                  type="button"
                  onClick={() => handleGoogleClick(true)}
                  disabled={isGoogleLoading}
                  className="text-[#B96D79] font-bold hover:underline cursor-pointer disabled:opacity-50"
                >
                  Use Redirect Sign-In
                </button>
              </div>
            </div>
          )}

          {/* OPTION B: Phone OTP via Firebase */}
          {authMethod === 'phone' && (
            <div className="space-y-3.5 pt-1">
              {!confirmationResult ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#25152F] mb-1">
                      Full Name / Business Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={role === 'owner' ? 'e.g. Ramesh Chandra' : 'e.g. Sneha Sharma'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border-2 border-[#DDD4E2] rounded-xl focus:outline-none focus:border-[#A8B88A] transition-all text-[#25152F] font-bold placeholder:text-[#5A4B63]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#25152F] mb-1">
                      Mobile Phone Number *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-mono font-bold text-[#5A4B63] border-r border-[#DDD4E2] pr-2">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="98450 12345"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-14 pr-3.5 py-2.5 text-xs bg-white border-2 border-[#DDD4E2] rounded-xl focus:outline-none focus:border-[#A8B88A] transition-all font-mono font-bold text-[#25152F] placeholder:text-[#5A4B63]"
                      />
                    </div>
                    <span className="text-[10px] text-[#5A4B63] mt-1 block">
                      A real 6-digit OTP will be dispatched via Firebase Phone Auth.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full py-2.5 px-4 bg-[#25152F] hover:bg-[#1A0F21] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
                  >
                    <span>{isSendingOtp ? 'Sending OTP...' : 'Send OTP via Firebase'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A8B88A]" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#25152F] mb-1">
                      Enter 6-Digit OTP Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base tracking-widest text-center bg-white border-2 border-[#DDD4E2] rounded-xl focus:outline-none focus:border-[#A8B88A] transition-all font-mono font-black text-[#25152F]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmationResult(null);
                        setOtp('');
                        setError(null);
                      }}
                      className="text-[#5A4B63] hover:text-[#25152F] underline cursor-pointer text-[11px] font-semibold"
                    >
                      Change Phone Number
                    </button>
                    <span className="text-[11px] text-[#5A4B63]">Resend in 30s</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="w-full py-2.5 px-4 bg-[#A8B88A] hover:bg-[#97A779] text-[#25152F] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{isVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP & Log In'}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#25152F]" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="px-6 py-3 bg-[#F7F2EA] border-t border-[#DDD4E2] flex items-center justify-center gap-2 text-xs text-[#5A4B63]">
          <ShieldCheck className="w-4 h-4 text-[#A8B88A]" />
          <span>Firebase 256-bit secure authentication. Never asks for Google password.</span>
        </div>
      </div>
    </div>
  );
};
