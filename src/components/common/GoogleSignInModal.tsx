import React, { useState } from 'react';
import { X, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: UserRole;
  onSuccess?: () => void;
}

interface SavedGoogleAccount {
  name: string;
  email: string;
  avatarBg: string;
  role: UserRole;
}

const DEFAULT_GOOGLE_PRESETS: SavedGoogleAccount[] = [
  {
    name: 'Atanu Foodie',
    email: 'foodie.explorer@gmail.com',
    avatarBg: 'bg-emerald-600',
    role: 'customer',
  },
  {
    name: 'Ramesh (Tumakuru Dosa)',
    email: 'ramesh.thatteidli@gmail.com',
    avatarBg: 'bg-amber-600',
    role: 'owner',
  },
  {
    name: 'Suresh (Bangalore Chaat)',
    email: 'suresh.chaathouse@gmail.com',
    avatarBg: 'bg-blue-600',
    role: 'owner',
  },
];

export const GoogleSignInModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetRole = 'customer',
  onSuccess,
}) => {
  const { loginUser, signInWithGoogle } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>(targetRole);
  const [mode, setMode] = useState<'chooser' | 'custom'>('chooser');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Keep selectedRole in sync with targetRole when opened
  React.useEffect(() => {
    if (targetRole) {
      setSelectedRole(targetRole);
    }
  }, [targetRole, isOpen]);

  if (!isOpen) return null;

  const handleGoogleOAuth = async (forceRedirect: boolean = false) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await signInWithGoogle(selectedRole, forceRedirect);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Google Sign-In was cancelled or blocked by browser.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = (account: SavedGoogleAccount) => {
    setIsLoading(true);
    setError('');
    try {
      loginUser(account.email, account.name, selectedRole);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    setIsLoading(true);
    setError('');
    try {
      loginUser(customEmail.trim(), customName.trim() || customEmail.split('@')[0], selectedRole, {
        phone: customPhone.trim() || undefined,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPresets = DEFAULT_GOOGLE_PRESETS.filter(
    (a) => a.role === selectedRole || a.role === 'customer'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Google Header */}
        <div className="p-6 border-b border-stone-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center p-2">
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
              <h2 className="text-base font-bold text-stone-900 font-display">
                Sign in with Google
              </h2>
              <p className="text-xs text-stone-500">
                Continue to <span className="font-semibold text-stone-800">ZAikya</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close Google Sign In"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Toggle Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex p-1 bg-stone-100 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign in as Customer
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedRole === 'owner'
                  ? 'bg-white text-amber-900 shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign in as Shop Owner
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-2 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium space-y-2">
              <p>{error}</p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleGoogleOAuth(true)}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Try Redirect Sign-In
                </button>
              </div>
            </div>
          )}

          {/* Primary Official Google OAuth Action */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleGoogleOAuth(false)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-stone-200 hover:border-[#E8A0B5] hover:bg-[#FCE8EF]/30 rounded-2xl text-xs font-bold text-stone-800 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
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
              <span>{isLoading ? 'Connecting...' : 'Continue with Google Account (OAuth)'}</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
              <span>Popup blocked or mobile browser?</span>
              <button
                type="button"
                onClick={() => handleGoogleOAuth(true)}
                className="text-[#C96884] font-semibold hover:underline cursor-pointer"
              >
                Use Redirect Sign-In
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-stone-400">or quick-select account</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {mode === 'chooser' ? (
            <div className="space-y-3">
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
                {filteredPresets.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    disabled={isLoading}
                    className="w-full p-3 flex items-center justify-between hover:bg-stone-50 transition-colors text-left cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${acc.avatarBg} text-white font-bold flex items-center justify-center text-xs shadow-xs`}>
                        {acc.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 group-hover:text-[#C96884] transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {acc.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-stone-400 group-hover:text-[#C96884] flex items-center gap-1">
                      <span>Select</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}

                {/* Enter Custom Google Account Option */}
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className="w-full p-3 flex items-center gap-3 hover:bg-[#FCE8EF]/40 transition-colors text-left cursor-pointer text-stone-700 hover:text-[#C96884]"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold">
                    Use another email account
                  </div>
                </button>
              </div>

              <p className="text-[11px] text-stone-400 text-center pt-1 leading-relaxed">
                By continuing, your {selectedRole} profile will be securely initialized on ZAikya.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Enter your Account details:
                </span>
                <button
                  type="button"
                  onClick={() => setMode('chooser')}
                  className="text-xs text-[#C96884] hover:underline cursor-pointer"
                >
                  Back to accounts
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-[#E8A0B5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. user@gmail.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:ring-2 focus:ring-[#E8A0B5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-[#E8A0B5] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMode('chooser')}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Sign In as {selectedRole === 'owner' ? 'Shop Owner' : 'Customer'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
