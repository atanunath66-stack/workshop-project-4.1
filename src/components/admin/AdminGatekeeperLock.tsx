import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPER_ADMIN_CREDENTIALS } from '../../utils/cancellationAndPricing';

interface Props {
  onUnlockSuccess?: () => void;
  onCancel?: () => void;
}

export const AdminGatekeeperLock: React.FC<Props> = ({ onUnlockSuccess, onCancel }) => {
  const { adminLogin } = useApp();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-300 font-semibold mb-1.5">
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
              className="w-full px-4 py-3 bg-stone-950 border border-stone-800 focus:border-[#E8A0B5] rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none font-mono text-xs transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-stone-300 font-semibold">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
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
                className="w-full pl-4 pr-10 py-3 bg-stone-950 border border-stone-800 focus:border-[#E8A0B5] rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none font-mono text-xs transition-colors"
              />
              <Lock className="w-4 h-4 text-stone-600 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Discovery</span>
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex-1 py-3 px-6 bg-[#34343A] hover:bg-[#232328] border border-[#E8A0B5]/40 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#E8A0B5]" />
              <span>{isLoading ? 'Verifying Credentials...' : 'Unlock Super Admin Console'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
