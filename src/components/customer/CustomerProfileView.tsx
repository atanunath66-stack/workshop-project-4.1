import React, { useState } from 'react';
import {
  User,
  FileText,
  Heart,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  LogOut,
  Save,
  CheckCircle2,
  Lock,
  Sparkles,
  MapPin,
  UtensilsCrossed,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  onGoToBookings: () => void;
  onDiscover: () => void;
}

export const CustomerProfileView: React.FC<Props> = ({ onGoToBookings, onDiscover }) => {
  const {
    isLoggedIn,
    currentUser,
    logoutUser,
    updateUserProfile,
    loginUser,
    openGoogleSignIn,
    bookings,
    setReceiptModalBooking,
    setIsAuthModalOpen,
    setAuthModalRole,
  } = useApp();

  // Profile form local state
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '+91 98765 43210');
  const [address, setAddress] = useState(currentUser.defaultAddress || 'Koramangala 4th Block, Bengaluru');
  const [dietaryPref, setDietaryPref] = useState<'all' | 'veg' | 'non-veg' | 'vegan'>(
    currentUser.dietaryPreference || 'all'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync profile fields if currentUser changes (e.g. after login)
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '+91 98765 43210');
      setAddress(currentUser.defaultAddress || 'Koramangala 4th Block, Bengaluru');
      setDietaryPref(currentUser.dietaryPreference || 'all');
    }
  }, [currentUser]);

  // If user is NOT logged in or not a customer, show Customer Login Gatekeeper
  if (!isLoggedIn || currentUser.role !== 'customer') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E8EC] shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#FCE8EF] text-[#C96884] border border-[#E8A0B5]/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE8EF] border border-[#E8A0B5]/40 text-[#34343A] text-[11px] font-bold uppercase tracking-wider">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#C96884]" />
              <span>Customer Portal Account</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-[#34343A]">
              Sign In to Access Your Foodie Profile
            </h1>
            <p className="text-xs text-[#777781] max-w-sm mx-auto leading-relaxed">
              Log in to view your verified foodie credentials, personal dining reservations, digital tax invoices, and favorite cravings.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => {
                openGoogleSignIn('customer');
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#E8E8EC] hover:bg-[#FCE8EF]/30 rounded-2xl text-xs font-semibold text-stone-700 transition-all shadow-2xs cursor-pointer"
            >
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
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthModalRole('customer');
                setIsAuthModalOpen(true);
              }}
              className="w-full py-3 px-4 bg-[#34343A] hover:bg-[#232328] text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#E8A0B5]" />
              <span>Sign In with Phone OTP / Email</span>
            </button>

            <button
              type="button"
              onClick={onDiscover}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors pt-2 inline-block font-medium"
            >
              ← Back to Local Food Discovery
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userBookings = bookings.filter((b) => b.customerId === currentUser.id);
  const completedBookings = userBookings.filter((b) => b.status === 'COMPLETED');
  const cancelledBookings = userBookings.filter((b) => b.status === 'CANCELLED');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim() || currentUser.name,
      phone: phone.trim(),
      defaultAddress: address.trim(),
      dietaryPreference: dietaryPref,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E8EC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FCE8EF] text-[#C96884] flex items-center justify-center font-bold text-2xl font-display shadow-inner">
            {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-stone-900">{currentUser.name}</h1>
              <span className="text-[10px] font-bold text-[#238B68] bg-[#238B68]/10 border border-[#238B68]/20 px-2.5 py-0.5 rounded-full">
                Verified Foodie
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
              <span className="flex items-center gap-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                {currentUser.email}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                {currentUser.phone || '+91 98765 43210'}
              </span>
            </div>
          </div>
        </div>

        {/* User Stats & Logout */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 divide-x divide-stone-100 text-xs">
          <div>
            <div className="text-stone-400 font-semibold uppercase text-[10px]">Total Bookings</div>
            <div className="text-xl font-bold font-display text-stone-900 mt-0.5">{userBookings.length}</div>
          </div>
          <div className="pl-4 sm:pl-6">
            <div className="text-stone-400 font-semibold uppercase text-[10px]">Completed Visits</div>
            <div className="text-xl font-bold font-display text-emerald-700 mt-0.5">{completedBookings.length}</div>
          </div>
          <div className="pl-4 sm:pl-6">
            <div className="text-stone-400 font-semibold uppercase text-[10px]">Refunds Settled</div>
            <div className="text-xl font-bold font-display text-stone-900 mt-0.5">{cancelledBookings.length}</div>
          </div>
          <div className="pl-4 sm:pl-6">
            <button
              type="button"
              onClick={logoutUser}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 rounded-xl text-xs font-semibold transition-colors border border-stone-200 cursor-pointer"
              title="Sign out of customer profile"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Details & Preferences Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
        <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-display text-[#34343A] flex items-center gap-2">
              <User className="w-4 h-4 text-[#C96884]" />
              <span>Personal Foodie Preferences & Details</span>
            </h2>
            <p className="text-xs text-[#777781] mt-0.5">
              Keep your contact details and dining preferences up to date for fast checkout
            </p>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#238B68]/10 text-[#238B68] border border-[#238B68]/20 rounded-xl text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#238B68]" />
              <span>Profile updated!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-[#E8E8EC] rounded-xl focus:outline-none focus:border-[#E8A0B5] font-medium"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Mobile Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-[#E8E8EC] rounded-xl focus:outline-none focus:border-[#E8A0B5] font-mono"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Default Area / Address (for Nearby Pre-Orders)
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-[#E8E8EC] rounded-xl focus:outline-none focus:border-[#E8A0B5]"
                placeholder="e.g. 4th Block Koramangala, Bengaluru"
              />
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-2">Dietary Preference</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Cuisines (Veg & Non-Veg)' },
                { id: 'veg', label: '🌱 Pure Vegetarian' },
                { id: 'non-veg', label: '🍗 Non-Vegetarian Specialist' },
                { id: 'vegan', label: '🥑 Vegan Friendly' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDietaryPref(opt.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    dietaryPref === opt.id
                      ? 'bg-[#34343A] text-white border-[#34343A] shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-[#E8E8EC] hover:bg-[#FCE8EF]/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#E8A0B5]" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Receipts Archive */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E8EC] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold font-display text-[#34343A] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C96884]" />
              <span>Digital Tax Invoices & Official Receipts</span>
            </h2>
            <p className="text-xs text-[#777781]">Official GST-compliant breakdown for your dining visits</p>
          </div>
          <button
            onClick={onGoToBookings}
            className="text-xs font-bold text-[#C96884] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {userBookings.length > 0 ? (
          <div className="divide-y divide-stone-100 text-xs">
            {userBookings.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-stone-900">{b.restaurantName}</div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    Receipt #{b.receiptNumber} · Date: {b.arrivalDate} · Status: {b.status}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-stone-900">₹{b.totalAmount}</span>
                  <button
                    onClick={() => setReceiptModalBooking(b)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">No dining receipts generated yet.</p>
        )}
      </div>

      {/* Cancellation & Policy FAQ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-4">
        <h2 className="text-base font-bold font-display text-stone-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Hyperlocal Fair Booking & Cancellation Guarantee</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-600 leading-relaxed">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
            <div className="font-bold text-stone-900">How does 50% advance work?</div>
            <p>
              When a small food vendor accepts your request, you pay 50% online via Razorpay to hold your table and allow them to start preparing your dishes fresh. The remaining balance is settled at the counter after dining.
            </p>
          </div>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
            <div className="font-bold text-stone-900">What if I need to cancel?</div>
            <p>
              Every stall's cancellation policy is shown before payment. If you cancel within the free cancellation window, you receive 100% refund. Otherwise, only the configured deduction (e.g. ₹40) is kept by the vendor and the rest is refunded to your source account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
