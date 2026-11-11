import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, X, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const AdminLoginModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const {
    isAdminLoginModalOpen,
    setIsAdminLoginModalOpen,
    adminLogin,
  } = useApp();

  const isModalVisible = isOpen !== undefined ? isOpen : isAdminLoginModalOpen;

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isModalVisible) return null;

  const handleClose = () => {
    if (onClose) onClose();
    setIsAdminLoginModalOpen(false);
    setErrorMsg(null);
    setAdminPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const res = adminLogin(adminEmail.trim(), adminPassword);
    setIsLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      handleClose();
    } else {
      setErrorMsg(res.error || 'Access denied. Invalid Super Admin email or master security password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
        {/* Header Strip */}
        <div className="bg-stone-900 text-white p-6 relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
            aria-label="Close admin login modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C96884] flex items-center justify-center font-bold text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#E8A0B5] uppercase tracking-widest block">
                Protected Central Console
              </span>
              <h2 className="text-xl font-bold font-display text-white">
                Super Admin Gatekeeper
              </h2>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          <p className="text-xs text-stone-600 leading-relaxed">
            Restricted access. Only the designated platform administrator account with verified master credentials may access the Super Admin Console.
          </p>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Enter authorized email"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:ring-2 focus:ring-[#E8A0B5] focus:bg-white transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-800">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:ring-2 focus:ring-[#E8A0B5] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#34343A] hover:bg-[#232328] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5 text-[#E8A0B5]" />
              <span>{isLoading ? 'Verifying...' : 'Unlock Super Admin'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
