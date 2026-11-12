import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPER_ADMIN_CREDENTIALS } from '../../utils/cancellationAndPricing';

interface Props {
  onUnlockSuccess?: () => void;
  onCancel?: () => void;
}

export const AdminGatekeeperLock: React.FC<Props> = ({ onUnlockSuccess, onCancel }) => {
  const { adminLogin, signInWithGoogle } = useApp();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  const handleGoogleAdmin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const res = await signInWithGoogle('admin');
      if (res.success) {
        if (onUnlockSuccess) onUnlockSuccess();
      } else {
        setError(res.error || 'Google Authentication failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = adminLogin(email, password);
      setIsLoading(false);

      if (res.success) {
        setPassword('');
        setError(null);
        if (onUnlockSuccess) onUnlockSuccess();
      } else {
        setError(res.error || 'Access Denied: Invalid credentials.');
      }
    }, 250);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 sm:p-10 border border-stone-800 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow decorative accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1.5 bg-gradient-to-r from-transparent via-[#E8A0B5] to-transparent" />

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#E8A0B5]/15 border border-[#E8A0B5]/30 text-[#E8A0B5] flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-[#E8A0B5]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800/80 border border-[#E8A0B5]/30 text-[#E8A0B5] text-[10px] font-mono uppercase font-bold tracking-widest">
              <KeyRound className="w-3 h-3" />
              <span>Restricted Master Console</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white mt-2">
              Super Admin Authentication Required
            </h1>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
              No one can access the Super Admin Portal without verified master credentials. Enter your authorized administrator email and password below.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/50 border border-rose-800/70 rounded-2xl flex items-start gap-3 text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Option 1: One-Click Authorized Google Admin Sign-In */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleAdmin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-stone-950 border border-stone-800 hover:border-[#E8A0B5] hover:bg-stone-800 rounded-xl text-xs font-semibold text-stone-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>{isGoogleLoading ? 'Verifying with Google...' : 'Sign In with Authorized Google Admin Account'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-800"></div>
            <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">Or enter master credentials</span>
            <div className="flex-1 h-px bg-stone-800"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-200 font-bold mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="Enter authorized email"
              className="w-full px-4 py-3 bg-stone-900 border-2 border-stone-700 focus:border-[#A8B88A] rounded-xl text-white placeholder:text-stone-400 focus:outline-none font-mono text-xs font-bold transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-stone-200 font-bold">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[#E9D8B5] hover:text-white flex items-center gap-1 transition-colors cursor-pointer font-bold"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter password"
                className="w-full pl-4 pr-10 py-3 bg-stone-900 border-2 border-stone-700 focus:border-[#A8B88A] rounded-xl text-white placeholder:text-stone-400 focus:outline-none font-mono text-xs font-bold transition-colors"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-stone-700 text-stone-200 hover:text-white hover:bg-stone-800 transition-colors font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Discovery</span>
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex-1 py-3 px-6 bg-[#A8B88A] hover:bg-[#97A779] border border-[#8C9C6F] text-[#25152F] rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#25152F]" />
              <span>{isLoading ? 'Verifying Credentials...' : 'Unlock Super Admin Console'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
