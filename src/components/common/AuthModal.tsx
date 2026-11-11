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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const res = await signInWithGoogle(role);
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
    setSuccessMsg(null);

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendPhoneOtp(cleanPhone, 'auth-recaptcha-container');
      if (res.success && res.confirmationResult) {
        setConfirmationResult(res.confirmationResult);
        setSuccessMsg(`OTP sent to ${cleanPhone}. Please enter the 6-digit verification code below.`);
      } else {
        setError(res.error || 'Failed to send OTP. Please check your phone number.');
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
      return;
    }

    setIsVerifyingOtp(true);
    setError(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#34343A]/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Invisible Recaptcha Anchor */}
      <div id="auth-recaptcha-container"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8E8EC] overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E8EC] bg-[#F7F7F8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCE8EF] border border-[#F8D3DF] flex items-center justify-center font-bold text-[#E8A0B5]">
              <Sparkles className="w-5 h-5 text-[#C96884]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#34343A] font-display">
                {role === 'customer'
                  ? 'Customer Sign In'
                  : role === 'owner'
                  ? 'Store Owner Sign In'
                  : 'Super Admin Access'}
              </h2>
              <p className="text-xs text-[#777781]">
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
            className="p-1.5 rounded-xl text-[#777781] hover:text-[#34343A] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Toggle Selector */}
        <div className="p-1.5 bg-[#E5E7EB]/60 mx-6 mt-5 rounded-2xl flex items-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthModalRole('customer');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              role === 'customer'
                ? 'bg-white text-[#34343A] font-bold shadow-xs'
                : 'text-[#777781] hover:text-[#34343A]'
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
                ? 'bg-white text-[#34343A] font-bold shadow-xs'
                : 'text-[#777781] hover:text-[#34343A]'
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
            className="flex-1 py-2 rounded-xl text-[#777781] hover:text-[#34343A] transition-all cursor-pointer"
          >
            Super Admin
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#FCE8EF] border border-[#F8D3DF] rounded-2xl text-xs text-[#D95368] font-medium leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-[#238B68] font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#238B68] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Authentication Method Tabs: Option A vs Option B */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F7F8] border border-[#E8E8EC] rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('google');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMethod === 'google'
                  ? 'bg-white text-[#34343A] font-bold shadow-xs border border-[#E8E8EC]'
                  : 'text-[#777781] hover:text-[#34343A]'
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
                  ? 'bg-white text-[#34343A] font-bold shadow-xs border border-[#E8E8EC]'
                  : 'text-[#777781] hover:text-[#34343A]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#C96884]" />
              <span>Option B: Phone OTP</span>
            </button>
          </div>

          {/* OPTION A: Google OAuth */}
          {authMethod === 'google' && (
            <div className="space-y-4 pt-1">
              <p className="text-xs text-[#777781] leading-relaxed">
                One-click verified login via Google OAuth. Automatically creates and links your {role === 'owner' ? 'Store Owner' : 'Customer'} profile in the database.
              </p>

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-[#E8E8EC] hover:bg-[#FCE8EF]/40 hover:border-[#E8A0B5] rounded-2xl text-sm font-semibold text-[#34343A] shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
            </div>
          )}

          {/* OPTION B: Phone OTP via Firebase */}
          {authMethod === 'phone' && (
            <div className="space-y-3.5 pt-1">
              {!confirmationResult ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#34343A] mb-1">
                      Full Name / Business Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={role === 'owner' ? 'e.g. Ramesh Chandra' : 'e.g. Sneha Sharma'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F7F7F8] border border-[#E8E8EC] rounded-xl focus:outline-none focus:border-[#E8A0B5] focus:bg-white transition-all text-[#34343A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#34343A] mb-1">
                      Mobile Phone Number *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-mono font-bold text-[#777781] border-r border-[#E8E8EC] pr-2">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="98450 12345"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-14 pr-3.5 py-2.5 text-xs bg-[#F7F7F8] border border-[#E8E8EC] rounded-xl focus:outline-none focus:border-[#E8A0B5] focus:bg-white transition-all font-mono text-[#34343A]"
                      />
                    </div>
                    <span className="text-[10px] text-[#777781] mt-1 block">
                      A real 6-digit OTP will be dispatched via Firebase Phone Auth.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full py-2.5 px-4 bg-[#34343A] hover:bg-[#232328] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
                  >
                    <span>{isSendingOtp ? 'Sending OTP...' : 'Send OTP via Firebase'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E8A0B5]" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#34343A] mb-1">
                      Enter 6-Digit OTP Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base tracking-widest text-center bg-[#F7F7F8] border border-[#E8E8EC] rounded-xl focus:outline-none focus:border-[#E8A0B5] focus:bg-white transition-all font-mono font-bold text-[#34343A]"
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
                      className="text-[#777781] hover:text-[#34343A] underline cursor-pointer text-[11px]"
                    >
                      Change Phone Number
                    </button>
                    <span className="text-[11px] text-[#777781]">Resend in 30s</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="w-full py-2.5 px-4 bg-[#E8A0B5] hover:bg-[#DF8FA7] text-[#34343A] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{isVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP & Log In'}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#34343A]" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="px-6 py-3 bg-[#F7F7F8] border-t border-[#E8E8EC] flex items-center justify-center gap-2 text-xs text-[#777781]">
          <ShieldCheck className="w-4 h-4 text-[#238B68]" />
          <span>Firebase 256-bit secure authentication. Never asks for Google password.</span>
        </div>
      </div>
    </div>
  );
};
