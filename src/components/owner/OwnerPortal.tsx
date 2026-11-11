import React, { useState } from 'react';
import {
  Store,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  ShieldAlert,
  FileText,
  Navigation,
  UtensilsCrossed,
  Save,
  ArrowRight,
  MapPin,
  Sparkles,
  ShieldCheck,
  Lock,
  Edit2,
  Smartphone,
  QrCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BookingStatus, CancellationPolicy, MenuItem, FoodCategory, Restaurant } from '../../types';
import { DigitalReceiptModal } from '../common/DigitalReceiptModal';
import { KARNATAKA_LOCATIONS } from '../../data/karnatakaLocations';
import { maskUpiId } from '../../utils/cancellationAndPricing';

export const OwnerPortal: React.FC = () => {
  const {
    isLoggedIn,
    currentUser,
    logoutUser,
    loginUser,
    openGoogleSignIn,
    setIsAuthModalOpen,
    setAuthModalRole,
    restaurants,
    bookings,
    ownerAcceptBooking,
    ownerRejectBooking,
    updateBookingLifecycleStatus,
    completeRemainingPayment,
    updateRestaurantCancellationPolicy,
    addMenuItemToRestaurant,
    toggleItemAvailability,
    updateRestaurantProfile,
    registerRestaurant,
    signInWithGoogle,
    setReceiptModalBooking,
    receiptModalBooking,
  } = useApp();

  // State hooks - must be called unconditionally at top of component
  const [activeTab, setActiveTab] = useState<'pipeline' | 'menu' | 'policy' | 'ledger'>('pipeline');

  // Registration wizard state (when owner has no restaurant registered yet)
  const [regName, setRegName] = useState('');
  const [regTagline, setRegTagline] = useState('');
  const [regDesc, setRegDesc] = useState('');
  const [regOwnerName, setRegOwnerName] = useState(currentUser?.name || 'Local Food Partner');
  const [regPhone, setRegPhone] = useState(currentUser?.phone || '+91 98220 12345');
  const [regEmail, setRegEmail] = useState(currentUser?.email || 'owner@alookhaoge.in');
  const [regAddress, setRegAddress] = useState('');
  const [regArea, setRegArea] = useState('Kyatsandra');
  const [regCity, setRegCity] = useState('Tumakuru (Tumkur)');
  const [regLat, setRegLat] = useState<number>(13.3134);
  const [regLng, setRegLng] = useState<number>(77.1623);
  const [regCoverImage, setRegCoverImage] = useState('/src/assets/images/street_food_chaat_1794251514362.jpg');
  const [regCategories, setRegCategories] = useState<FoodCategory[]>(['Street Food', 'Fast Food']);
  const [regOpeningTime, setRegOpeningTime] = useState('11:00 AM');
  const [regClosingTime, setRegClosingTime] = useState('11:00 PM');
  const [regPriceForTwo, setRegPriceForTwo] = useState(250);
  const [regTotalTables, setRegTotalTables] = useState(6);
  const [regFacilities, setRegFacilities] = useState<string[]>(['Street Bench Seating', 'UPI Accepted', 'Takeaway']);
  const [regUpiId, setRegUpiId] = useState('');
  const [editingUpiId, setEditingUpiId] = useState('');
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [upiSavedSuccess, setUpiSavedSuccess] = useState(false);

  // Sync owner identity when currentUser changes
  React.useEffect(() => {
    if (currentUser?.name && currentUser.name !== 'Guest User') {
      setRegOwnerName(currentUser.name);
    }
    if (currentUser?.email) {
      setRegEmail(currentUser.email);
    }
    if (currentUser?.phone) {
      setRegPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Initial dish inputs during registration
  const [initialDishName, setInitialDishName] = useState('Signature Special Dish');
  const [initialDishPrice, setInitialDishPrice] = useState(120);
  const [initialDishVeg, setInitialDishVeg] = useState(true);
  const [initialDishPrep, setInitialDishPrep] = useState(10);
  const [initialDishDesc, setInitialDishDesc] = useState('Freshly made on order with house-special spices.');

  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [submittedRestId, setSubmittedRestId] = useState<string | null>(null);

  // Policy form state
  const [policyType, setPolicyType] = useState<CancellationPolicy['type']>('fixed');
  const [deductionValue, setDeductionValue] = useState(40);
  const [minCharge, setMinCharge] = useState(40);
  const [deadlineMinutes, setDeadlineMinutes] = useState(20);
  const [policySaved, setPolicySaved] = useState(false);

  // New menu item modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(120);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Street Food');
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemPrepTime, setNewItemPrepTime] = useState(10);

  // Rejection modal
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Table fully occupied right now');
  const [suggestedTime, setSuggestedTime] = useState('In 45 minutes');

  // If user is not logged in or not a store owner, show Store Owner Gatekeeper
  if (!isLoggedIn || currentUser.role !== 'owner') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E8EC] shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#FCE8EF] text-[#C96884] border border-[#E8A0B5]/30 flex items-center justify-center mx-auto shadow-inner">
            <Store className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE8EF] border border-[#E8A0B5]/40 text-[#34343A] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#C96884]" />
              <span>Small Food Business Portal</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-[#34343A]">
              Store Owner Sign In Required
            </h1>
            <p className="text-xs text-[#777781] max-w-sm mx-auto leading-relaxed">
              Log in to your verified Store Owner account to manage your menu dishes, live customer bookings, and payout settlements.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                const res = await signInWithGoogle('owner');
                if (!res.success && res.error) {
                  openGoogleSignIn('owner');
                }
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
              <span>Continue with Google (Store Owner)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthModalRole('owner');
                setIsAuthModalOpen(true);
              }}
              className="w-full py-3 px-4 bg-[#34343A] hover:bg-[#232328] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Sign In with Phone OTP / Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find restaurant owned by current user (supports matching by UID, restaurantId, email or phone)
  const ownerRestaurant = restaurants.find(
    (r) =>
      r.ownerId === currentUser.id ||
      r.id === currentUser.restaurantId ||
      (currentUser.email && r.email && r.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser.phone && r.phone && r.phone === currentUser.phone)
  );

  // Handle new restaurant registration submission with strict duplicate guard and write confirmation
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReg) return; // Prevent duplicate concurrent submissions

    if (!regName.trim() || !regAddress.trim() || !regUpiId.trim()) {
      setRegError('Please provide restaurant name, complete address, and your UPI ID for direct customer payouts.');
      return;
    }
    setRegError(null);
    setIsSubmittingReg(true);

    try {
      const initialMenu: MenuItem[] = [
        {
          id: `m-init-${Date.now()}`,
          name: initialDishName,
          price: initialDishPrice,
          description: initialDishDesc,
          category: regCategories[0] || 'Street Food',
          isVeg: initialDishVeg,
          isAvailable: true,
          prepTimeMinutes: initialDishPrep,
          image: regCoverImage,
          bestseller: true,
        },
      ];

      const newPolicy: CancellationPolicy = {
        type: policyType,
        deductionValue,
        minDeductionCharge: minCharge,
        freeCancellationDeadlineMinutes: deadlineMinutes,
        allowCancellationAfterPrepStarts: false,
        termsText:
          policyType === 'fixed'
            ? `Free cancellation up to ${deadlineMinutes} minutes before arrival. ₹${deductionValue} flat deduction applies if cancelled later.`
            : `Free cancellation up to ${deadlineMinutes} minutes prior. ${deductionValue}% deduction (min ₹${minCharge}) applies thereafter.`,
      };

      const finalOwnerId = currentUser?.id && currentUser.id !== 'guest' ? currentUser.id : `owner-${Date.now().toString().slice(-4)}`;
      const finalOwnerName = regOwnerName.trim() || currentUser?.name || 'Local Food Partner';
      const finalPhone = regPhone.trim() || '+91 98220 12345';
      const finalEmail = regEmail.trim() || currentUser?.email || 'owner@alookhaoge.in';

      const created = await registerRestaurant({
        name: regName.trim(),
        tagline: regTagline.trim() || 'Authentic local specialty eatery',
        description: regDesc.trim() || 'Locally owned neighborhood culinary gem.',
        ownerId: finalOwnerId,
        ownerName: finalOwnerName,
        phone: finalPhone,
        email: finalEmail,
        upiId: regUpiId.trim(),
        address: regAddress,
        area: regArea,
        city: regCity,
        lat: regLat,
        lng: regLng,
        coverImage: regCoverImage,
        galleryImages: [regCoverImage],
        categories: regCategories,
        openingTime: regOpeningTime,
        closingTime: regClosingTime,
        priceForTwo: regPriceForTwo,
        facilities: regFacilities,
        totalTables: regTotalTables,
        availableTables: regTotalTables,
        cancellationPolicy: newPolicy,
        menu: initialMenu,
      });

      setSubmittedRestId(created.id);
    } catch (err: any) {
      console.error('Registration submission error:', err);
      setRegError(err?.message || 'Failed to submit registration to Firestore. Please check your network and permissions.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // If owner has NOT registered a restaurant yet, show the Business Registration Wizard
  if (!ownerRestaurant) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E8EC] shadow-sm space-y-6">
          <div className="border-b border-[#E8E8EC] pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCE8EF] text-[#34343A] rounded-full text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C96884]" />
              <span>Register Your Food Business</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#34343A] font-display">
              List Your Restaurant or Food Stall on ZAikya
            </h1>
            <p className="text-xs sm:text-sm text-[#777781] mt-1 max-w-2xl leading-relaxed">
              Empower your stall with digital table pre-bookings and advance payments. Fill out your real business details below for Super Admin verification.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-6 text-xs">
            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold">
                {regError}
              </div>
            )}

            {/* Step 1: Basic details */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-stone-900">
                1. Basic Business Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Restaurant / Stall Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Calcutta Kati Roll Corner"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Tagline / Specialties</label>
                  <input
                    type="text"
                    value={regTagline}
                    onChange={(e) => setRegTagline(e.target.value)}
                    placeholder="e.g. Charcoal grilled double chicken rolls"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">About Your Food & Heritage</label>
                <textarea
                  rows={2}
                  value={regDesc}
                  onChange={(e) => setRegDesc(e.target.value)}
                  placeholder="Tell foodies how long you have been serving, specialty ingredients..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Shop Owner UPI ID for Direct Payouts */}
              <div className="p-4 bg-[#FCE8EF]/40 rounded-2xl border border-[#E8A0B5]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#C96884]" />
                    <span>Shop Owner UPI ID (For Direct Customer Payouts) *</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#238B68] bg-[#238B68]/10 border border-[#238B68]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Direct 98% Merchant Credit</span>
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={regUpiId}
                  onChange={(e) => setRegUpiId(e.target.value)}
                  placeholder="e.g. yourshopname@okhdfcbank or 9822012345@paytm"
                  className="w-full p-2.5 bg-white border border-[#E8E8EC] rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#E8A0B5]"
                />
                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                  <span className="flex items-center gap-1 text-stone-600">
                    <Lock className="w-3 h-3 text-stone-400" />
                    <span>UPI ID is strictly encrypted & masked in customer views</span>
                  </span>
                  {regUpiId.trim() && (
                    <span className="font-mono text-stone-400">
                      Customer preview: {maskUpiId(regUpiId.trim())}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Location and Coordinates */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-stone-900">
                  2. Location & Map Coordinates
                </h2>
                <span className="text-[11px] text-[#34343A] bg-[#FCE8EF] border border-[#E8A0B5]/40 px-2.5 py-0.5 rounded-full font-semibold">
                  Karnataka Statewide Support
                </span>
              </div>

              {/* Quick Preset Buttons for Karnataka Hubs including Tumakuru */}
              <div className="p-3 bg-stone-50 border border-[#E8E8EC] rounded-2xl space-y-2">
                <div className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C96884]" />
                  <span>Quick Pick Karnataka Food Hub (Auto-fills Coordinates):</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: '⭐ Kyatsandra, Tumakuru', area: 'Kyatsandra', city: 'Tumakuru (Tumkur)', lat: 13.3134, lng: 77.1623 },
                    { label: '⭐ MG Road, Tumakuru', area: 'MG Road & Town Hall', city: 'Tumakuru (Tumkur)', lat: 13.3409, lng: 77.101 },
                    { label: '⭐ Siddaganga Math, Tumakuru', area: 'Siddaganga Math Road', city: 'Tumakuru (Tumkur)', lat: 13.3228, lng: 77.1475 },
                    { label: '⭐ Mandipet, Tumakuru', area: 'Mandipet & Gubbi Gate', city: 'Tumakuru (Tumkur)', lat: 13.3421, lng: 77.0987 },
                    { label: 'Koramangala, Bengaluru', area: 'Koramangala', city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
                    { label: 'Malleshwaram, Bengaluru', area: 'Malleshwaram', city: 'Bengaluru', lat: 13.0031, lng: 77.5643 },
                    { label: 'MCC B Block, Davanagere', area: 'MCC B Block', city: 'Davanagere', lat: 14.4645, lng: 75.9212 },
                    { label: 'Nazarbad, Mysuru', area: 'Nazarbad & Agrahara', city: 'Mysuru', lat: 12.3034, lng: 76.6645 },
                    { label: 'Hampankatta, Mangaluru', area: 'Hampankatta', city: 'Mangaluru', lat: 12.8698, lng: 74.8431 },
                    { label: 'Car Street, Udupi', area: 'Car Street', city: 'Udupi', lat: 13.3409, lng: 74.7421 },
                    { label: 'Line Bazaar, Dharwad', area: 'Line Bazaar', city: 'Dharwad', lat: 15.4589, lng: 75.0078 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setRegArea(preset.area);
                        setRegCity(preset.city);
                        setRegLat(preset.lat);
                        setRegLng(preset.lng);
                      }}
                      className="px-2 py-1 bg-white hover:bg-[#FCE8EF]/50 hover:border-[#E8A0B5] border border-[#E8E8EC] rounded-lg text-[10px] font-semibold text-stone-700 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-700 block mb-1">Complete Street Address *</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Shop number, Street, Landmark (e.g. NH 48, Kyatsandra Circle)"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Neighborhood Area *</label>
                  <input
                    type="text"
                    required
                    list="karnataka-area-list"
                    value={regArea}
                    onChange={(e) => setRegArea(e.target.value)}
                    placeholder="e.g. Kyatsandra / Koramangala"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                  <datalist id="karnataka-area-list">
                    {KARNATAKA_LOCATIONS.map((l) => (
                      <option key={`${l.area}-${l.city}`} value={l.area}>
                        {l.city} - {l.landmark}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">City / District *</label>
                  <input
                    type="text"
                    required
                    list="karnataka-city-list"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="e.g. Tumakuru (Tumkur) / Bengaluru"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                  <datalist id="karnataka-city-list">
                    {Array.from(new Set(KARNATAKA_LOCATIONS.map((l) => l.city))).map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Latitude Coordinate</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={regLat}
                    onChange={(e) => setRegLat(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Longitude Coordinate</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={regLng}
                    onChange={(e) => setRegLng(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Photos and Timings */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-stone-900">
                3. Operations & Photos
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Opening Time</label>
                  <input
                    type="text"
                    value={regOpeningTime}
                    onChange={(e) => setRegOpeningTime(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Closing Time</label>
                  <input
                    type="text"
                    value={regClosingTime}
                    onChange={(e) => setRegClosingTime(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Approx. Price for Two (₹)</label>
                  <input
                    type="number"
                    value={regPriceForTwo}
                    onChange={(e) => setRegPriceForTwo(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Cover Image Photo URL</label>
                <input
                  type="text"
                  value={regCoverImage}
                  onChange={(e) => setRegCoverImage(e.target.value)}
                  placeholder="/src/assets/images/street_food_chaat_1794251514362.jpg"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Step 4: Initial Signature Dish */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-stone-900">
                4. Add Your First Signature Dish
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={initialDishName}
                    onChange={(e) => setInitialDishName(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Dish Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={initialDishPrice}
                    onChange={(e) => setInitialDishPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    value={initialDishPrep}
                    onChange={(e) => setInitialDishPrep(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingReg}
              className="w-full py-3.5 px-6 bg-[#34343A] hover:bg-[#232328] text-white rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmittingReg ? 'Saving Restaurant to Cloud Firestore...' : 'Submit Restaurant for Admin Verification'}</span>
              <ArrowRight className="w-4 h-4 text-[#E8A0B5]" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If owner HAS registered a restaurant, handle its views & status
  const isPending =
    ownerRestaurant.status === 'PENDING_APPROVAL' ||
    ownerRestaurant.status === 'pending';
  const isActive =
    ownerRestaurant.status === 'ACTIVE' ||
    ownerRestaurant.status === 'active';
  const isRejected =
    ownerRestaurant.status === 'REJECTED' ||
    ownerRestaurant.status === 'rejected';

  const restaurantBookings = bookings.filter((b) => b.restaurantId === ownerRestaurant.id);
  const pendingBookings = restaurantBookings.filter((b) => b.status === 'PENDING');
  const inProgressBookings = restaurantBookings.filter((b) =>
    ['ACCEPTED', 'CUSTOMER ARRIVING', 'ARRIVED', 'SERVED'].includes(b.status)
  );
  const completedBookings = restaurantBookings.filter((b) => b.status === 'COMPLETED');

  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const advanceCollected = restaurantBookings
    .filter((b) => b.paymentStatus !== 'PENDING')
    .reduce((sum, b) => sum + b.advanceAmount, 0);

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPolicy: CancellationPolicy = {
      type: policyType,
      deductionValue,
      minDeductionCharge: minCharge,
      freeCancellationDeadlineMinutes: deadlineMinutes,
      allowCancellationAfterPrepStarts: false,
      termsText:
        policyType === 'fixed'
          ? `Free cancellation up to ${deadlineMinutes} minutes before arrival. ₹${deductionValue} flat deduction applies thereafter.`
          : `Free cancellation up to ${deadlineMinutes} minutes prior. ${deductionValue}% deduction (min ₹${minCharge}) applies thereafter.`,
    };

    updateRestaurantCancellationPolicy(ownerRestaurant.id, updatedPolicy);
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2500);
  };

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addMenuItemToRestaurant(ownerRestaurant.id, {
      name: newItemName,
      price: newItemPrice,
      description: newItemDesc,
      category: newItemCategory,
      isVeg: newItemIsVeg,
      isAvailable: true,
      prepTimeMinutes: newItemPrepTime,
      image: ownerRestaurant.coverImage,
    });

    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Pending verification status alert banner */}
      {isPending && (
        <div className="p-4 sm:p-5 bg-[#FCE8EF]/60 rounded-3xl border border-[#E8A0B5]/50 shadow-xs flex items-start gap-3 text-xs text-[#34343A]">
          <Clock className="w-5 h-5 text-[#C96884] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="font-bold text-[#34343A] text-sm font-display flex items-center gap-2">
              <span>Pending Approval</span>
              <span className="text-[10px] px-2 py-0.5 bg-[#E8A0B5]/30 text-[#34343A] rounded font-mono font-semibold">
                Status: PENDING_APPROVAL
              </span>
            </h2>
            <p className="leading-relaxed text-stone-600">
              Your restaurant registration for <span className="font-semibold text-stone-900">{ownerRestaurant.name}</span> is saved in Cloud Firestore and is pending review by Super Admin. Once approved, it will automatically appear in customer discovery and accept live pre-bookings.
            </p>
          </div>
        </div>
      )}

      {/* Rejection notice banner */}
      {isRejected && (
        <div className="p-4 sm:p-5 bg-rose-50 rounded-3xl border border-rose-200 shadow-xs flex items-start gap-3 text-xs text-rose-950">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="font-bold text-rose-900 text-sm font-display">
              Registration Needs Modification
            </h2>
            <p className="leading-relaxed">
              Your application was reviewed with notes: <span className="font-semibold italic">"{ownerRestaurant.rejectionReason || 'Please review business details and contact admin.'}"</span>.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner with Venue details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E8EC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-[#E8E8EC]">
            <img
              src={ownerRestaurant.coverImage}
              alt={ownerRestaurant.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#34343A] bg-[#FCE8EF] px-2 py-0.5 rounded-md uppercase tracking-wider">
                Store Owner Dashboard
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  isActive
                    ? 'text-[#238B68] bg-[#238B68]/10'
                    : isPending
                    ? 'text-[#C96884] bg-[#FCE8EF] border border-[#E8A0B5]/40'
                    : isRejected
                    ? 'text-rose-700 bg-rose-50 border border-rose-200'
                    : 'text-stone-700 bg-stone-100'
                }`}
              >
                {isActive
                  ? 'Active & Published'
                  : isPending
                  ? 'Pending Approval'
                  : isRejected
                  ? 'Rejected'
                  : 'Suspended'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-bold font-display text-stone-900">
                {ownerRestaurant.name}
              </h1>
              <button
                type="button"
                onClick={logoutUser}
                className="px-2.5 py-1 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 rounded-lg text-xs font-semibold border border-stone-200 transition-colors cursor-pointer"
                title="Sign out of store owner account"
              >
                Sign Out
              </button>
            </div>
            <p className="text-xs text-stone-500">
              {ownerRestaurant.address} · {ownerRestaurant.area} · Owner: <span className="font-semibold text-stone-700">{currentUser.name}</span> ({currentUser.email})
            </p>
          </div>
        </div>

        {/* Real Dynamic KPI Strip (Calculated from actual database records) */}
        <div className="flex items-center gap-4 divide-x divide-stone-100 text-xs">
          <div className="pr-4">
            <div className="text-stone-400 font-semibold uppercase text-[10px]">Today's Requests</div>
            <div className="text-xl font-bold font-display text-stone-900 mt-0.5">
              {restaurantBookings.length}
            </div>
          </div>
          <div className="pl-4 pr-4">
            <div className="text-stone-400 font-semibold uppercase text-[10px]">Pending Actions</div>
            <div className="text-xl font-bold font-display text-[#C96884] mt-0.5">
              {pendingBookings.length}
            </div>
          </div>
          <div className="pl-4">
            <div className="text-stone-400 font-semibold uppercase text-[10px]">Total Revenue</div>
            <div className="text-xl font-bold font-mono text-[#238B68] mt-0.5">
              ₹{totalRevenue}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E8EC] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'pipeline' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/40'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Live Booking Pipeline</span>
          {pendingBookings.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#E8A0B5] text-[#34343A] text-[10px] flex items-center justify-center font-bold">
              {pendingBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'menu' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Menu & Availability ({ownerRestaurant.menu.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'policy' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Cancellation Policy Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'ledger' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Revenue & Settlements</span>
        </button>
      </div>

      {/* Tab 1: Live Booking Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-8">
          {pendingBookings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#C96884]">
                <AlertCircle className="w-4 h-4" />
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[#34343A]">
                  New Incoming Requests ({pendingBookings.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingBookings.map((bkg) => (
                  <div
                    key={bkg.id}
                    className="p-5 bg-[#FCE8EF]/40 border border-[#E8A0B5]/40 rounded-3xl space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-mono text-stone-400">Order #{bkg.id}</div>
                        <h3 className="font-bold text-stone-900 font-display text-base">
                          {bkg.customerName}
                        </h3>
                        <div className="text-xs text-stone-500">
                          {bkg.numberOfGuests} Guests · {bkg.seatingPreference} · Arrival: {bkg.arrivalTime}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#34343A] text-white rounded-lg text-[10px] font-bold">
                        Pending
                      </span>
                    </div>

                    {bkg.items.length > 0 && (
                      <div className="bg-white/90 p-3 rounded-2xl border border-[#E8A0B5]/30 text-xs space-y-1">
                        <span className="font-bold text-stone-700">Pre-ordered Dishes:</span>
                        {bkg.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-stone-700">
                            <span>{it.quantity}x {it.name} {it.notes ? `("${it.notes}")` : ''}</span>
                            <span className="font-mono">₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#E8A0B5]/30">
                      <div className="text-xs">
                        <span className="text-stone-500">Total: </span>
                        <span className="font-bold text-stone-900 font-mono">₹{bkg.totalAmount}</span>
                        <span className="text-stone-400 text-[11px]"> (Advance ₹{bkg.advanceAmount})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRejectingBookingId(bkg.id)}
                          className="px-3 py-1.5 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Decline / Suggest Time
                        </button>

                        <button
                          type="button"
                          onClick={() => ownerAcceptBooking(bkg.id)}
                          className="px-4 py-1.5 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#238B68]" />
                          <span>Accept Booking</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-stone-900">
              Active Orders & Seated Diners ({inProgressBookings.length})
            </h2>

            {inProgressBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-stone-200 text-stone-500 text-xs space-y-1">
                <div className="font-semibold text-stone-700">You haven't received any bookings yet.</div>
                <p>When customers discover your restaurant and pre-book dishes, requests will appear here in real time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inProgressBookings.map((bkg) => (
                  <div
                    key={bkg.id}
                    className="p-5 bg-white border border-stone-200 rounded-3xl space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-mono text-stone-400">#{bkg.id}</div>
                        <h3 className="font-bold text-stone-900 text-base font-display">
                          {bkg.customerName}
                        </h3>
                        <div className="text-xs text-stone-500">{bkg.numberOfGuests} Guests · ETA: {bkg.arrivalTime}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded-xl text-xs font-bold">
                        {bkg.status}
                      </span>
                    </div>

                    {bkg.customerLocationShared && (
                      <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center gap-3 text-xs">
                        <Navigation className="w-4 h-4 text-purple-600 animate-pulse shrink-0" />
                        <div>
                          <span className="font-bold text-purple-950">Customer Shared Live GPS: </span>
                          <span className="text-purple-700">Approaching venue now. Dishes being prepared.</span>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-stone-50 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between text-stone-600">
                        <span>Advance Received (Razorpay):</span>
                        <span className="font-mono font-bold text-emerald-700">₹{bkg.advanceAmount}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Remaining Balance to Collect:</span>
                        <span className="font-mono font-bold text-stone-900">₹{bkg.remainingAmount}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {bkg.status === 'ACCEPTED' && (
                          <button
                            onClick={() => updateBookingLifecycleStatus(bkg.id, 'CUSTOMER ARRIVING')}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold"
                          >
                            Mark: Customer Arriving
                          </button>
                        )}
                        {(bkg.status === 'ACCEPTED' || bkg.status === 'CUSTOMER ARRIVING') && (
                          <button
                            onClick={() => updateBookingLifecycleStatus(bkg.id, 'ARRIVED')}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-xl text-xs font-semibold"
                          >
                            Mark: Seated / Arrived
                          </button>
                        )}
                        {bkg.status === 'ARRIVED' && (
                          <button
                            onClick={() => updateBookingLifecycleStatus(bkg.id, 'SERVED')}
                            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold"
                          >
                            Mark: Dishes Served
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => completeRemainingPayment(bkg.id, 'UPI')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Collect ₹{bkg.remainingAmount} & Finish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Menu Management */}
      {activeTab === 'menu' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900">Food Menu & Dish Availability</h2>
              <p className="text-xs text-stone-500">Toggle out-of-stock items or add new signature dishes</p>
            </div>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-4 py-2 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E8A0B5]" />
              <span>Add New Dish</span>
            </button>
          </div>

          {ownerRestaurant.menu.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-stone-200 rounded-2xl">
              This restaurant hasn't added its menu yet. Click "Add New Dish" above to create dishes!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ownerRestaurant.menu.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-stone-50 rounded-2xl border border-[#E8E8EC] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}
                      />
                      <h3 className="font-bold text-stone-900">{item.name}</h3>
                    </div>
                    <div className="font-mono font-bold text-stone-800">₹{item.price}</div>
                    <p className="text-stone-500 line-clamp-1">{item.description}</p>
                    <div className="text-[11px] text-stone-400">Prep time: ~{item.prepTimeMinutes} mins</div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => toggleItemAvailability(ownerRestaurant.id, item.id)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        item.isAvailable
                          ? 'bg-[#238B68]/15 text-[#238B68]'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Dedicated Cancellation Policy Setup */}
      {activeTab === 'policy' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E8EC] shadow-xs space-y-6">
          <div className="border-b border-[#E8E8EC] pb-4">
            <h2 className="text-lg font-bold font-display text-[#34343A] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#C96884]" />
              <span>Configure Restaurant Cancellation Policy</span>
            </h2>
            <p className="text-xs text-[#777781] mt-1 max-w-2xl">
              Set fair deduction terms when customers cancel after paying 50% advance. The policy is shown transparently to customers before checkout.
            </p>
          </div>

          {policySaved && (
            <div className="p-3 bg-[#238B68]/10 border border-[#238B68]/20 rounded-xl text-xs text-[#238B68] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#238B68]" />
              <span>Cancellation policy saved and updated for all future reservations!</span>
            </div>
          )}

          <form onSubmit={handleSavePolicy} className="space-y-6 max-w-xl">
            <div className="space-y-2 text-xs">
              <label className="font-bold text-stone-800 block">Deduction Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPolicyType('fixed')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    policyType === 'fixed'
                      ? 'border-stone-900 bg-[#FCE8EF] text-stone-900 font-semibold'
                      : 'border-[#E8E8EC] text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="font-bold text-sm">Fixed Deduction (₹)</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">e.g. ₹40 flat deduction</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyType('percentage')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    policyType === 'percentage'
                      ? 'border-stone-900 bg-[#FCE8EF] text-stone-900 font-semibold'
                      : 'border-[#E8E8EC] text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="font-bold text-sm">Percentage Deduction (%)</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">e.g. 15% of advance paid</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  {policyType === 'fixed' ? 'Fixed Deduction Amount (₹)' : 'Deduction Percentage (%)'}
                </label>
                <input
                  type="number"
                  min={10}
                  max={policyType === 'fixed' ? 200 : 50}
                  value={deductionValue}
                  onChange={(e) => setDeductionValue(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Minimum Charge Floor (₹)
                </label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={minCharge}
                  onChange={(e) => setMinCharge(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-bold text-stone-800 block mb-1">
                Free Cancellation Deadline Window (Minutes Before Arrival)
              </label>
              <select
                value={deadlineMinutes}
                onChange={(e) => setDeadlineMinutes(Number(e.target.value))}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
              >
                <option value={15}>15 Minutes Before (Recommended for street stalls)</option>
                <option value={20}>20 Minutes Before</option>
                <option value={30}>30 Minutes Before (Recommended for grills & kebabs)</option>
                <option value={60}>60 Minutes Before</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#E8A0B5]" />
              <span>Save Cancellation Policy</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Revenue & Settlements Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E8EC] shadow-xs space-y-6">
          <div className="border-b border-[#E8E8EC] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold font-display text-[#34343A]">Financial Settlements Ledger</h2>
              <p className="text-xs text-[#777781]">Real-time breakdown of online advances, 98% direct merchant payouts, and 2% platform commission</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#238B68]/10 text-[#238B68] border border-[#238B68]/20 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#238B68]" />
              <span>Direct Bank Settlement Active</span>
            </span>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-stone-50 rounded-2xl border border-[#E8E8EC] space-y-1">
              <span className="text-stone-400 font-semibold uppercase text-[10px]">Gross Sales</span>
              <div className="text-xl font-bold font-mono text-stone-900">₹{totalRevenue}</div>
              <p className="text-[11px] text-stone-500">Total customer orders</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-2xl border border-[#E8E8EC] space-y-1">
              <span className="text-stone-400 font-semibold uppercase text-[10px]">Online Advances</span>
              <div className="text-xl font-bold font-mono text-blue-700">₹{advanceCollected}</div>
              <p className="text-[11px] text-stone-500">Collected via Google Pay/PhonePe</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-2xl border border-[#E8E8EC] space-y-1">
              <span className="text-stone-400 font-semibold uppercase text-[10px]">Platform Fee (2%)</span>
              <div className="text-xl font-bold font-mono text-stone-600">₹{Math.round(totalRevenue * 0.02)}</div>
              <p className="text-[11px] text-stone-500">Platform convenience charge</p>
            </div>
            <div className="p-4 bg-[#238B68]/10 rounded-2xl border border-[#238B68]/20 space-y-1">
              <span className="text-[#238B68] font-semibold uppercase text-[10px]">Net Payout (98%)</span>
              <div className="text-xl font-bold font-mono text-[#238B68]">
                ₹{Math.round(totalRevenue * 0.98)}
              </div>
              <p className="text-[11px] text-[#238B68]">Directly deposited to your UPI ID</p>
            </div>
          </div>

          {/* Shop Owner Payout UPI Account Card */}
          <div className="p-5 bg-gradient-to-br from-[#FCE8EF]/50 to-stone-50 border border-[#E8A0B5]/40 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FCE8EF] text-[#C96884] border border-[#E8A0B5]/40 flex items-center justify-center shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-display flex items-center gap-2">
                    <span>Direct Merchant UPI Settlement Account</span>
                    <span className="text-[10px] font-semibold text-[#238B68] bg-[#238B68]/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      NPCI Protected
                    </span>
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Customers pay directly to this verified UPI ID. 98% settles instantly into your bank.
                  </p>
                </div>
              </div>

              {!isEditingUpi && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUpiId(ownerRestaurant?.upiId || '');
                    setIsEditingUpi(true);
                    setUpiSavedSuccess(false);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Update UPI ID</span>
                </button>
              )}
            </div>

            {/* Display Masked Account / Edit Form */}
            {isEditingUpi ? (
              <div className="p-3 bg-white rounded-xl border border-[#E8A0B5]/40 space-y-2 mt-2">
                <label className="text-xs font-bold text-stone-800 block">
                  Enter New Shop Owner UPI ID:
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={editingUpiId}
                    onChange={(e) => setEditingUpiId(e.target.value)}
                    placeholder="e.g. yourbusiness@okhdfcbank"
                    className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#E8A0B5]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (editingUpiId.trim() && ownerRestaurant) {
                          updateRestaurantProfile(ownerRestaurant.id, {
                            upiId: editingUpiId.trim(),
                          });
                          setIsEditingUpi(false);
                          setUpiSavedSuccess(true);
                          setTimeout(() => setUpiSavedSuccess(false), 4000);
                        }
                      }}
                      className="px-4 py-2 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Save Payout UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingUpi(false)}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Preview in customer payment modal: <span className="font-mono font-semibold text-stone-700">{maskUpiId(editingUpiId)}</span>
                </p>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">Registered Settlement VPA:</span>
                  <span className="font-mono font-bold text-stone-900 text-sm bg-stone-100 px-2.5 py-1 rounded-lg">
                    {maskUpiId(ownerRestaurant?.upiId || 'Not Configured')}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Strict Privacy: Never displayed unmasked to diners</span>
                </div>
              </div>
            )}

            {upiSavedSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>UPI ID successfully updated! All upcoming customer payments will route to this address.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Booking Modal */}
      {rejectingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold font-display text-base">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Decline or Suggest Time</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Reason for Rejection</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                >
                  <option>Table fully occupied right now</option>
                  <option>Ingredients out of stock for pre-ordered dish</option>
                  <option>Stall closing early today</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Suggest Alternative Time (Optional)</label>
                <input
                  type="text"
                  value={suggestedTime}
                  onChange={(e) => setSuggestedTime(e.target.value)}
                  placeholder="e.g. In 45 minutes / 08:30 PM"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingBookingId(null)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  ownerRejectBooking(rejectingBookingId, rejectReason, suggestedTime);
                  setRejectingBookingId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Menu Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-stone-900">Add Dish to Menu</h3>
            <form onSubmit={handleCreateMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Tikka Kathi Roll"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    required
                    min={2}
                    value={newItemPrepTime}
                    onChange={(e) => setNewItemPrepTime(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, spice level, chutney pairings..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemIsVeg}
                    onChange={(e) => setNewItemIsVeg(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <span className="font-semibold text-stone-700">Vegetarian Dish</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Add Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal for Owner */}
      <DigitalReceiptModal
        booking={receiptModalBooking}
        onClose={() => setReceiptModalBooking(null)}
      />
    </div>
  );
};
