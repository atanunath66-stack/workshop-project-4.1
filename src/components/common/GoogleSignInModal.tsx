import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useApp, isSafariBrowser } from '../../context/AppContext';
import { UserRole } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: UserRole;
  onSuccess?: () => void;
}

export const GoogleSignInModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetRole = 'customer',
  onSuccess,
}) => {
  const { signInWithGoogle, redirectAuthError, clearRedirectAuthError } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>(targetRole);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatusText, setAuthStatusText] = useState('Connecting to Google...');

  // Keep selectedRole in sync with targetRole when opened
  React.useEffect(() => {
    if (targetRole) {
      setSelectedRole(targetRole);
    }
  }, [targetRole, isOpen]);

  // Sync redirect auth errors if coming back from failed redirect
  React.useEffect(() => {
    if (redirectAuthError) {
      setError(redirectAuthError);
    }
  }, [redirectAuthError]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async (forceRedirect: boolean = false) => {
    setIsLoading(true);
    setError('');
    clearRedirectAuthError?.();

    const isSafari = isSafariBrowser();
    if (forceRedirect || isSafari) {
      setAuthStatusText('Redirecting to Google for secure sign-in...');
    } else {
      setAuthStatusText('Opening Google Sign-In window...');
    }

    try {
      const res = await signInWithGoogle(selectedRole, forceRedirect);
      if (res.success) {
        if (res.warning?.includes('Redirecting')) {
          setAuthStatusText(res.warning);
          // Wait for browser top-level navigation to proceed
          return;
        }
        setAuthStatusText('Authentication successful! Synchronizing profile...');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Google Sign-In could not be completed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25152F]/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DDD4E2] overflow-hidden my-auto">
        {/* Header - Warm Ivory Background with Midnight Plum Title */}
        <div className="p-6 bg-[#F7F2EA] border-b border-[#DDD4E2] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#DDD4E2] shadow-xs flex items-center justify-center p-2">
              <svg className="w-full h-full" viewBox="0 0 24 24">
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
            <div>
              <h2 className="text-base font-bold text-[#25152F] font-display">
                Sign in with Google
              </h2>
              <p className="text-xs text-[#5A4B63]">
                Continue to <span className="font-semibold text-[#25152F]">ZAikya</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-full text-[#5A4B63] hover:text-[#25152F] hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close Google Sign In"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Toggle Bar */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex p-1 bg-[#F7F2EA] border border-[#DDD4E2] rounded-2xl text-xs font-semibold">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setSelectedRole('customer')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-white text-[#25152F] shadow-xs font-bold border border-[#DDD4E2]'
                  : 'text-[#5A4B63] hover:text-[#25152F]'
              }`}
            >
              Sign in as Customer
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setSelectedRole('owner')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                selectedRole === 'owner'
                  ? 'bg-white text-[#25152F] shadow-xs font-bold border border-[#DDD4E2]'
                  : 'text-[#5A4B63] hover:text-[#25152F]'
              }`}
            >
              Sign in as Shop Owner
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-3 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-medium space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
              <div className="flex gap-2 pt-1 pl-6">
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(true)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-[#B96D79] hover:bg-[#a65d69] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Try Redirect Sign-In
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-[#A8B88A] animate-spin" />
              <p className="text-xs font-semibold text-[#25152F]">{authStatusText}</p>
              <p className="text-[11px] text-[#5A4B63]">Please complete the sign-in prompt from Google</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#5A4B63] leading-relaxed">
                Connect your verified Google Account to pre-book tables, pre-order dishes, and access your profile securely on ZAikya.
              </p>

              {/* Primary Sign In Button (signInWithPopup) */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn(false)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-[#F7F2EA] border-2 border-[#DDD4E2] hover:border-[#A8B88A] rounded-2xl text-sm font-bold text-[#25152F] shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
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
                <span>Continue with Google</span>
              </button>

              {/* Safari / Mobile Fallback: Redirect Mode */}
              <div className="p-3 bg-[#F7F2EA] rounded-2xl border border-[#DDD4E2] flex items-center justify-between text-xs">
                <div className="text-left">
                  <span className="font-bold text-[#25152F] block">Popup blocked or on Safari?</span>
                  <span className="text-[11px] text-[#5A4B63]">Use direct page redirect instead</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(true)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-[#A8B88A] hover:bg-[#97A779] text-[#25152F] font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                >
                  Redirect Sign-In
                </button>
              </div>
            </div>
          )}

          {/* Security Assurance */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#5A4B63] border-t border-[#DDD4E2]">
            <ShieldCheck className="w-4 h-4 text-[#A8B88A] shrink-0" />
            <span>Official Firebase Google OAuth. Passwords are never shared.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
