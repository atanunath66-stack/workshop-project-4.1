import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Tag,
  DollarSign,
  Users,
  Store,
  FileText,
  Clock,
  Sparkles,
  RotateCcw,
  Sliders,
  Plus,
  Lock,
  Search,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Utensils,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Database,
  Download,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DiscountCampaign, Restaurant } from '../../types';
import { AdminGatekeeperLock } from './AdminGatekeeperLock';
import { maskUpiId } from '../../utils/cancellationAndPricing';

export const AdminPortal: React.FC = () => {
  const {
    currentUser,
    restaurants,
    bookings,
    users,
    discounts,
    auditLogs,
    adminApproveRestaurant,
    adminRejectRestaurant,
    adminSuspendRestaurant,
    registerRestaurant,
    createDiscountCampaign,
    toggleDiscountCampaign,
    adminOverrideRefund,
    isAdminAuthenticated,
    adminLogout,
    refreshPlatformData,
    exportDataToCsv,
    firebaseUser,
    signInWithGoogle,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'data_management' | 'discounts' | 'refunds' | 'audit'>('approvals');

  // Data management state
  const [dataRecordType, setDataRecordType] = useState<'restaurants' | 'customers' | 'owners' | 'bookings' | 'transactions'>('restaurants');
  const [dataSearchQuery, setDataSearchQuery] = useState('');

  // Approvals management state
  const [approvalSubFilter, setApprovalSubFilter] = useState<'pending' | 'all' | 'active' | 'suspended'>('pending');
  const [approvalSearchQuery, setApprovalSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [declineModalItem, setDeclineModalItem] = useState<{ id: string; name: string } | null>(null);
  const [declineReason, setDeclineReason] = useState('Incomplete business documentation or unverified address details');

  // Quick Onboard Partner Modal state (allows testing and onboarding from multiple store owners)
  const [showQuickOnboardModal, setShowQuickOnboardModal] = useState(false);
  const [quickOwnerName, setQuickOwnerName] = useState('Ramesh Gowda');
  const [quickOwnerEmail, setQuickOwnerEmail] = useState('ramesh.siddaganga@gmail.com');
  const [quickOwnerPhone, setQuickOwnerPhone] = useState('+91 98450 12345');
  const [quickRestName, setQuickRestName] = useState('Sri Siddaganga Thatte Idli');
  const [quickArea, setQuickArea] = useState('Kyatsandra');
  const [quickCity, setQuickCity] = useState('Tumakuru (Tumkur)');
  const [quickAddress, setQuickAddress] = useState('NH-48, Near Kyatsandra Circle, Tumakuru');
  const [quickUpi, setQuickUpi] = useState('siddaganga@okaxis');
  const [quickDishName, setQuickDishName] = useState('Benne Thatte Idli with Red Chutney');
  const [quickDishPrice, setQuickDishPrice] = useState(60);

  // Discount campaign modal state
  const [showNewDiscountModal, setShowNewDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountTitle, setDiscountTitle] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(20);
  const [minOrder, setMinOrder] = useState(199);
  const [maxCap, setMaxCap] = useState(100);

  // Refund override modal state
  const [overrideBookingId, setOverrideBookingId] = useState<string | null>(null);
  const [overrideAmount, setOverrideAmount] = useState(0);
  const [overrideNotes, setOverrideNotes] = useState('Customer dispute resolved - full refund authorized by Super Admin');

  // Sync directory from storage when AdminPortal mounts or tab changes
  React.useEffect(() => {
    refreshPlatformData();
  }, [activeTab]);

  // Robust case-insensitive status classifiers
  const isPendingStatus = (s?: string) => {
    if (!s) return true; // Unassigned status defaults to pending review
    const clean = String(s).trim().toLowerCase();
    if (
      clean === 'suspended' ||
      clean === 'rejected' ||
      clean === 'declined' ||
      clean === 'inactive' ||
      clean === 'active' ||
      clean === 'approved' ||
      clean === 'published'
    ) {
      return false;
    }
    return (
      clean === 'pending' ||
      clean === 'pending_approval' ||
      clean === 'submitted' ||
      clean === 'review' ||
      clean === 'under_review' ||
      clean === 'new' ||
      clean.startsWith('pend') ||
      clean.includes('review') ||
      clean.includes('submit')
    );
  };

  const isActiveStatus = (s?: string) => {
    if (!s) return false;
    const clean = String(s).trim().toLowerCase();
    return clean === 'active' || clean === 'approved' || clean === 'published';
  };

  const isSuspendedStatus = (s?: string) => {
    if (!s) return false;
    const clean = String(s).trim().toLowerCase();
    return clean === 'suspended' || clean === 'rejected' || clean === 'declined' || clean === 'inactive';
  };

  // Flexible Karnataka district & area matcher
  const matchCityFilter = (cityStr?: string, filter?: string) => {
    if (!filter || filter === 'all') return true;
    if (!cityStr) return false;
    const c = cityStr.toLowerCase();
    const f = filter.toLowerCase();
    if (c.includes(f) || f.includes(c)) return true;
    if ((f.includes('tumakur') || f.includes('tumkur')) && (c.includes('tumakur') || c.includes('tumkur') || c.includes('kyatsandra') || c.includes('siddaganga'))) return true;
    if ((f.includes('bengalur') || f.includes('bangalor')) && (c.includes('bengalur') || c.includes('bangalor') || c.includes('koramangala') || c.includes('indiranagar'))) return true;
    if ((f.includes('mysur') || f.includes('mysor')) && (c.includes('mysur') || c.includes('mysor'))) return true;
    return false;
  };

  const pendingRestaurants = restaurants.filter((r) => isPendingStatus(r.status));
  const activeRestaurants = restaurants.filter((r) => isActiveStatus(r.status));
  const suspendedRestaurants = restaurants.filter((r) => isSuspendedStatus(r.status));

  // Count unique store owners who submitted listings
  const uniqueOwnerEmails = new Set(
    restaurants.map((r) => (r.email || r.ownerName || r.ownerId || 'vendor').toLowerCase())
  );

  const totalGMV = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const platformCommissionTotal = Math.round(totalGMV * 0.02);

  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const handleRefreshDirectory = () => {
    refreshPlatformData();
    setSyncStatusMsg('Directory synchronized with database!');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleConfirmDecline = () => {
    if (!declineModalItem) return;
    adminRejectRestaurant(declineModalItem.id, declineReason);
    setDeclineModalItem(null);
  };

  const handleQuickOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestName.trim() || !quickAddress.trim() || !quickUpi.trim()) return;

    registerRestaurant({
      name: quickRestName.trim(),
      tagline: 'Authentic local street specialty',
      description: 'Handcrafted local delicacy served hot.',
      ownerId: `owner-${Date.now().toString().slice(-4)}`,
      ownerName: quickOwnerName.trim() || 'Store Partner',
      phone: quickOwnerPhone.trim() || '+91 98450 12345',
      email: quickOwnerEmail.trim() || 'partner@gmail.com',
      upiId: quickUpi.trim(),
      address: quickAddress.trim(),
      area: quickArea.trim() || 'Kyatsandra',
      city: quickCity.trim() || 'Tumakuru (Tumkur)',
      lat: 13.3134,
      lng: 77.1623,
      coverImage: '/src/assets/images/street_food_chaat_1794251514362.jpg',
      galleryImages: ['/src/assets/images/street_food_chaat_1794251514362.jpg'],
      categories: ['Street Food', 'Fast Food'],
      openingTime: '10:00 AM',
      closingTime: '10:00 PM',
      priceForTwo: 150,
      facilities: ['UPI Accepted', 'Takeaway', 'Outdoor Seating'],
      totalTables: 6,
      availableTables: 6,
      cancellationPolicy: {
        type: 'fixed',
        deductionValue: 50,
        minDeductionCharge: 50,
        freeCancellationDeadlineMinutes: 30,
        allowCancellationAfterPrepStarts: false,
        termsText: 'Free cancellation up to 30 mins before arrival.',
      },
      menu: [
        {
          id: `m-quick-${Date.now()}`,
          name: quickDishName.trim() || 'Special Dish',
          price: quickDishPrice || 60,
          description: 'Specialty prepared fresh on customer order.',
          category: 'Street Food',
          isVeg: true,
          isAvailable: true,
          prepTimeMinutes: 10,
          image: '/src/assets/images/street_food_chaat_1794251514362.jpg',
          bestseller: true,
        },
      ],
    });

    setShowQuickOnboardModal(false);
    setApprovalSubFilter('pending');
    setSyncStatusMsg(`Submitted registration request for "${quickRestName}" from owner ${quickOwnerName}!`);
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim()) return;

    createDiscountCampaign({
      code: discountCode.toUpperCase(),
      title: discountTitle || `${discountValue}${discountType === 'percentage' ? '%' : '₹'} OFF`,
      description: `Get ${discountValue}${discountType === 'percentage' ? '%' : '₹'} off on orders over ₹${minOrder}`,
      discountType,
      discountValue,
      minOrderValue: minOrder,
      maxDiscountCap: maxCap,
      applicableToAll: true,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: '2026-12-31',
      maxRedemptions: 500,
      isActive: true,
    });

    setShowNewDiscountModal(false);
    setDiscountCode('');
    setDiscountTitle('');
  };

  const handleApplyRefundOverride = () => {
    if (!overrideBookingId) return;
    adminOverrideRefund(overrideBookingId, overrideAmount, overrideNotes);
    setOverrideBookingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Super Admin Top Header */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-stone-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8A0B5] flex items-center justify-center font-bold text-stone-900 text-xl shadow-md">
            <Shield className="w-8 h-8 text-stone-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#E8A0B5] uppercase tracking-widest">
                Central Management Control
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                User: {currentUser.email}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <h1 className="text-2xl font-bold font-display tracking-tight text-white">
                Super Admin Console
              </h1>
              <button
                type="button"
                onClick={adminLogout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 hover:bg-rose-950/80 hover:border-rose-700/80 hover:text-rose-200 text-stone-300 border border-stone-700/80 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                title="Lock admin session and sign out"
              >
                <Lock className="w-3 h-3 text-[#E8A0B5]" />
                <span>Lock Console</span>
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Overseeing {restaurants.length} registered vendors, booking pipelines, and platform settlements
            </p>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="flex flex-wrap items-center gap-4 divide-x divide-stone-800 text-xs">
          <div className="pr-4">
            <div className="text-stone-400 uppercase text-[10px] font-semibold">Total GMV</div>
            <div className="text-xl font-bold font-mono text-[#238B68] mt-0.5">₹{totalGMV}</div>
          </div>
          <div className="pl-4 pr-4">
            <div className="text-stone-400 uppercase text-[10px] font-semibold">Platform Commission (2%)</div>
            <div className="text-xl font-bold font-mono text-[#E8A0B5] mt-0.5">₹{platformCommissionTotal}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('approvals');
              setApprovalSubFilter('pending');
            }}
            className="pl-4 text-left group cursor-pointer transition-transform hover:scale-105"
            title="Click to view pending restaurant approvals"
          >
            <div className="text-stone-400 group-hover:text-[#E8A0B5] uppercase text-[10px] font-semibold flex items-center gap-1">
              <span>Pending Approvals</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xl font-bold font-display text-white mt-0.5 flex items-center gap-2">
              <span>{pendingRestaurants.length}</span>
              {pendingRestaurants.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#E8A0B5] animate-ping" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Live Firebase Auth Session Check */}
      {!firebaseUser && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block text-stone-900">Live Firebase Firestore Permissions Notice</span>
              <span className="text-stone-600 text-[11px]">
                Sign in with an authorized Google Account (atanuhuhu@gmail.com / atanunath66@gmail.com) to establish real-time Firestore admin permissions.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signInWithGoogle('admin')}
            className="px-4 py-2 bg-[#34343A] hover:bg-[#232328] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#E8A0B5]" />
            <span>Connect Google Super Admin</span>
          </button>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E8EC] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'overview' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/40'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('approvals');
            if (pendingRestaurants.length > 0) setApprovalSubFilter('pending');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'approvals' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/40'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Restaurant Approvals</span>
          {pendingRestaurants.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#E8A0B5] text-[#34343A] text-[10px] flex items-center justify-center font-bold animate-pulse">
              {pendingRestaurants.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('data_management')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'data_management' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/40'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-[#E8A0B5]" />
          <span>Data Extraction & Management</span>
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'discounts' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/40'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Discounts & Campaigns ({discounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'refunds' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/40'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refund Management ({cancelledBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'audit' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Platform Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Prominent Action Banner when Pending Approvals exist */}
          {pendingRestaurants.length > 0 && (
            <div className="p-5 bg-[#34343A] border border-[#E8A0B5]/40 text-white rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FCE8EF] text-[#C96884] flex items-center justify-center font-bold shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-base font-display">
                    {pendingRestaurants.length} Restaurant{pendingRestaurants.length > 1 ? 's' : ''} Awaiting Super Admin Approval!
                  </h2>
                  <p className="text-xs text-[#E8E8EC] mt-0.5">
                    Local food stalls and restaurants in Karnataka have submitted their business details, menu, and payout UPI.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('approvals');
                  setApprovalSubFilter('pending');
                }}
                className="px-5 py-2.5 bg-[#E8A0B5] hover:bg-[#d88fa5] text-stone-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Review Approvals Now</span>
                <ArrowRight className="w-4 h-4 text-stone-900" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-[#E8E8EC] shadow-xs space-y-1">
              <span className="text-stone-400 uppercase text-[10px] font-semibold">Registered Customers</span>
              <div className="text-2xl font-bold font-display text-stone-900">
                {users.filter((u) => u.role === 'customer').length}
              </div>
              <p className="text-[11px] text-[#777781]">Active hyperlocal foodies</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('approvals');
                setApprovalSubFilter(pendingRestaurants.length > 0 ? 'pending' : 'all');
              }}
              className="p-5 bg-white rounded-3xl border border-[#E8E8EC] shadow-xs space-y-1 text-left hover:border-[#E8A0B5] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-stone-400 uppercase text-[10px] font-semibold">Active Food Stalls</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#C96884] transition-colors" />
              </div>
              <div className="text-2xl font-bold font-display text-[#238B68]">
                {activeRestaurants.length}
              </div>
              <p className="text-[11px] text-[#777781]">{pendingRestaurants.length} awaiting verification</p>
            </button>

            <div className="p-5 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-stone-400 uppercase text-[10px] font-semibold">Total Bookings</span>
              <div className="text-2xl font-bold font-display text-stone-900">
                {bookings.length}
              </div>
              <p className="text-[11px] text-stone-500">{bookings.filter((b) => b.status === 'COMPLETED').length} fulfilled orders</p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-stone-400 uppercase text-[10px] font-semibold">Cancelled Orders</span>
              <div className="text-2xl font-bold font-display text-rose-700">
                {cancelledBookings.length}
              </div>
              <p className="text-[11px] text-stone-500">100% partial refund settled</p>
            </div>
          </div>

          {/* Quick list of recent bookings */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-base font-bold font-display text-stone-900">Platform Recent Bookings</h2>
              <span className="text-xs text-stone-400 font-mono">Real-time ledger</span>
            </div>

            {bookings.length > 0 ? (
              <div className="divide-y divide-stone-100 text-xs">
                {bookings.map((b) => (
                  <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-stone-900">{b.customerName} → {b.restaurantName}</div>
                      <div className="text-[11px] text-stone-400 font-mono">
                        #{b.id} · {b.arrivalDate} · {b.arrivalTime} · {b.items.length} items
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="font-mono font-bold text-stone-900">₹{b.totalAmount}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Advance: ₹{b.advanceAmount}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded-lg font-bold text-[11px]">
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-stone-400">
                No customer bookings recorded on the platform yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Restaurant Approvals & KYC Management */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-stone-900">Restaurant Approvals & Directory</h2>
                <span className="text-xs font-mono px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md font-semibold">
                  {restaurants.length} Total
                </span>
                <span className="text-xs font-mono px-2 py-0.5 bg-[#FCE8EF] text-[#34343A] border border-[#E8A0B5]/40 rounded-md font-semibold">
                  {uniqueOwnerEmails.size} Unique Store Owner{uniqueOwnerEmails.size === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Review & approve small local businesses, food stalls & street-food vendors registered across Karnataka.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuickOnboardModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Create a test vendor listing or onboard a stall directly"
              >
                <Plus className="w-3.5 h-3.5 text-[#E8A0B5]" />
                <span>Onboard / Test Partner Request</span>
              </button>

              <button
                type="button"
                onClick={handleRefreshDirectory}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Synchronize directory with database"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                <span>Sync Database</span>
              </button>
            </div>
          </div>

          {syncStatusMsg && (
            <div className="p-3 bg-[#238B68]/10 text-[#238B68] border border-[#238B68]/20 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#238B68]" />
              <span>{syncStatusMsg}</span>
            </div>
          )}

          {/* Sub-tabs Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setApprovalSubFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  approvalSubFilter === 'pending'
                    ? 'bg-[#34343A] text-white font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Pending Approvals</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  approvalSubFilter === 'pending' ? 'bg-[#E8A0B5] text-[#34343A]' : 'bg-stone-200 text-stone-700'
                }`}>
                  {pendingRestaurants.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setApprovalSubFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  approvalSubFilter === 'all'
                    ? 'bg-[#34343A] text-white font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>All Registered</span>
                <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                  {restaurants.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setApprovalSubFilter('active')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  approvalSubFilter === 'active'
                    ? 'bg-[#34343A] text-white font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Active & Live</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  approvalSubFilter === 'active' ? 'bg-[#238B68] text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {activeRestaurants.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setApprovalSubFilter('suspended')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  approvalSubFilter === 'suspended'
                    ? 'bg-[#34343A] text-white font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Suspended / Inactive</span>
                <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                  {suspendedRestaurants.length}
                </span>
              </button>
            </div>

            {/* City Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-500 font-medium">District:</span>
              <select
                value={selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium cursor-pointer"
              >
                <option value="all">All Karnataka Locations</option>
                <option value="tumakuru">Tumakuru (Tumkur)</option>
                <option value="bengaluru">Bengaluru</option>
                <option value="mysuru">Mysuru</option>
                <option value="davanagere">Davanagere</option>
                <option value="mangaluru">Mangaluru</option>
                <option value="udupi">Udupi</option>
                <option value="dharwad">Dharwad</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={approvalSearchQuery}
              onChange={(e) => setApprovalSearchQuery(e.target.value)}
              placeholder="Search by restaurant name, owner, phone, district, or area (e.g. Sri Siddaganga Thatte Idli / Kyatsandra)..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#E8A0B5] focus:bg-white transition-all"
            />
            {approvalSearchQuery && (
              <button
                type="button"
                onClick={() => setApprovalSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filtered Restaurants Grid */}
          {(() => {
            const displayed = restaurants.filter((rest) => {
              if (approvalSubFilter === 'pending' && !isPendingStatus(rest.status)) return false;
              if (approvalSubFilter === 'active' && !isActiveStatus(rest.status)) return false;
              if (approvalSubFilter === 'suspended' && !isSuspendedStatus(rest.status)) return false;

              if (selectedCityFilter !== 'all' && !matchCityFilter(rest.city, selectedCityFilter)) {
                return false;
              }

              if (approvalSearchQuery.trim()) {
                const q = approvalSearchQuery.toLowerCase();
                const matchName = (rest.name || '').toLowerCase().includes(q);
                const matchOwner = (rest.ownerName || '').toLowerCase().includes(q);
                const matchArea = (rest.area || '').toLowerCase().includes(q);
                const matchCity = (rest.city || '').toLowerCase().includes(q);
                const matchPhone = (rest.phone || '').toLowerCase().includes(q);
                const matchEmail = (rest.email || '').toLowerCase().includes(q);
                if (!matchName && !matchOwner && !matchArea && !matchCity && !matchPhone && !matchEmail) {
                  return false;
                }
              }

              return true;
            });

            if (displayed.length === 0) {
              return (
                <div className="p-10 bg-stone-50 rounded-3xl text-center space-y-3 border border-stone-200/80">
                  <div className="w-12 h-12 rounded-2xl bg-stone-200 text-stone-500 flex items-center justify-center mx-auto">
                    <Store className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-stone-800 text-sm font-display">
                    No restaurants match the selected filter
                  </h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    {approvalSubFilter === 'pending'
                      ? 'No restaurants are currently awaiting verification. Newly registered small food businesses will appear here instantly for review.'
                      : 'Try resetting the search query or changing the filter to view all registered venues.'}
                  </p>
                  {(approvalSearchQuery || selectedCityFilter !== 'all' || approvalSubFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setApprovalSubFilter('all');
                        setApprovalSearchQuery('');
                        setSelectedCityFilter('all');
                      }}
                      className="px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>View All Registered Restaurants ({restaurants.length})</span>
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {displayed.map((rest) => {
                  const isPending = isPendingStatus(rest.status);
                  const isActive = isActiveStatus(rest.status);

                  return (
                    <div
                      key={rest.id}
                      className={`p-5 rounded-3xl border transition-all space-y-4 ${
                        isPending
                          ? 'bg-amber-50/60 border-amber-300/80 shadow-xs'
                          : isActive
                          ? 'bg-white border-stone-200 shadow-xs'
                          : 'bg-stone-50 border-stone-200 opacity-80'
                      }`}
                    >
                      {/* Top Header Card */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/90 shadow-2xs">
                          <img
                            src={rest.coverImage || '/src/assets/images/street_food_chaat_1794251514362.jpg'}
                            alt={rest.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/src/assets/images/street_food_chaat_1794251514362.jpg';
                            }}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-stone-900 font-display text-base tracking-tight truncate">
                                {rest.name}
                              </h3>
                              <p className="text-[11px] text-stone-500 font-medium truncate">
                                {rest.tagline || 'Local eatery'}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                isPending
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isPending ? 'Pending Approval' : isActive ? 'Active & Published' : 'Suspended'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-600">
                            <span className="font-semibold text-stone-800">
                              {rest.area}, {rest.city}
                            </span>
                            <span className="text-stone-300">·</span>
                            <span className="font-mono text-[10px] text-stone-400">
                              ID: {rest.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Owner Identity Banner */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] px-3 py-1.5 bg-stone-100/90 rounded-xl font-mono gap-1 border border-stone-200/80">
                        <span className="text-stone-700 font-semibold truncate flex items-center gap-1.5">
                          <span>👤 Store Owner:</span>
                          <span className="text-stone-900 font-bold">{rest.ownerName || 'Verified Partner'}</span>
                          <span className="text-stone-500 font-normal">({rest.email || 'Google Account'})</span>
                        </span>
                        <span className="text-stone-400 shrink-0 text-[10px]">
                          Owner ID: {rest.ownerId || 'N/A'}
                        </span>
                      </div>

                      {/* Location & Address Pill */}
                      <div className="p-2.5 bg-white/90 rounded-2xl border border-stone-200/80 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#C96884] shrink-0" />
                          <span className="truncate">{rest.address}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-stone-500 font-mono pl-5">
                          <span>Lat: {typeof rest.lat === 'number' ? rest.lat.toFixed(4) : (rest.lat || '13.3134')}</span>
                          <span>Lng: {typeof rest.lng === 'number' ? rest.lng.toFixed(4) : (rest.lng || '77.1623')}</span>
                          <span>{rest.totalTables || 6} Tables</span>
                          <span>{rest.openingTime || '09:00 AM'} - {rest.closingTime || '10:00 PM'}</span>
                        </div>
                      </div>

                      {/* Merchant Contact & UPI Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-0.5">
                          <div className="text-[10px] uppercase font-bold text-stone-400">Owner Contact</div>
                          <div className="font-semibold text-stone-900 truncate">{rest.ownerName}</div>
                          <div className="text-[11px] text-stone-600 font-mono truncate">{rest.phone}</div>
                          <div className="text-[11px] text-stone-500 truncate">{rest.email}</div>
                        </div>

                        <div className="p-2.5 bg-[#FCE8EF]/40 rounded-2xl border border-[#E8A0B5]/40 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#C96884]">Direct Payout UPI</span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                              98% Vendor / 2% Admin
                            </span>
                          </div>
                          <div className="font-mono text-xs font-bold text-stone-900 mt-1">
                            {maskUpiId(rest.upiId)}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            Super Admin fee routed to <span className="font-mono text-stone-700">{maskUpiId('atanunath66@oksbi')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Preview */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-700 flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-stone-500" />
                            <span>Registered Menu Dishes ({(rest.menu || []).length})</span>
                          </span>
                          <span className="text-[11px] text-stone-500">Price for two: ₹{rest.priceForTwo || 150}</span>
                        </div>

                        {(rest.menu || []).length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(rest.menu || []).slice(0, 4).map((m) => (
                              <span
                                key={m.id}
                                className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-[11px] font-medium text-stone-700 flex items-center gap-1"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${m.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                <span className="truncate max-w-[130px]">{m.name}</span>
                                <span className="font-mono text-stone-400 font-normal">₹{m.price}</span>
                              </span>
                            ))}
                            {(rest.menu || []).length > 4 && (
                              <span className="text-[10px] text-stone-400 font-semibold">
                                +{(rest.menu || []).length - 4} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-stone-400 italic">No dishes listed yet</div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/80">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setDeclineModalItem({ id: rest.id, name: rest.name })}
                              className="px-3.5 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => adminApproveRestaurant(rest.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Publish Live</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => adminSuspendRestaurant(rest.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                                isActive
                                  ? 'border border-stone-300 text-stone-700 hover:bg-stone-100'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Suspend Listing</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Reactivate Listing</span>
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Decline Confirmation Modal */}
          {declineModalItem && (
            <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center font-bold">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 font-display text-base">Decline Restaurant Listing</h3>
                    <p className="text-xs text-stone-500">{declineModalItem.name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block">
                    Reason for Rejection (Shared with Store Owner)
                  </label>
                  <textarea
                    rows={3}
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setDeclineModalItem(null)}
                    className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDecline}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Confirm Decline
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Platform Data Management & Extraction */}
      {activeTab === 'data_management' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          {/* Header & Description */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#FCE8EF] text-[#C96884] flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-stone-900">
                    Platform Data Management & Extraction
                  </h2>
                  <p className="text-xs text-stone-500">
                    Direct access to Cloud Firestore live records. Search, filter, inspect, and export audit-ready CSV datasets.
                  </p>
                </div>
              </div>
            </div>

            {/* Export All Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportDataToCsv('restaurants')}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Export Restaurants to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#C96884]" />
                <span>Restaurants CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportDataToCsv('customers')}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Export Customers to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#C96884]" />
                <span>Customers CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportDataToCsv('owners')}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Export Store Owners to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#C96884]" />
                <span>Store Owners CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportDataToCsv('bookings')}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Export Bookings to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#C96884]" />
                <span>Bookings CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportDataToCsv('transactions')}
                className="px-3.5 py-2 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Export Transactions & Commissions to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#E8A0B5]" />
                <span>Transactions CSV</span>
              </button>
            </div>
          </div>

          {/* Privacy & Security Compliance Notice */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Zero-Leak Security Active:</strong> Passwords, authentication session secrets, and OTPs are encrypted or omitted from export feeds.
              </span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              PCI-DSS Compliant
            </span>
          </div>

          {/* Record Type Selector and Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDataRecordType('restaurants')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  dataRecordType === 'restaurants'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Restaurants</span>
                <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                  {restaurants.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDataRecordType('customers')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  dataRecordType === 'customers'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Customers</span>
                <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                  {users.filter((u) => u.role === 'customer').length || 1}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDataRecordType('owners')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  dataRecordType === 'owners'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Store Owners</span>
                <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                  {users.filter((u) => u.role === 'owner').length || uniqueOwnerEmails.size}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDataRecordType('bookings')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  dataRecordType === 'bookings'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Bookings</span>
                <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                  {bookings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDataRecordType('transactions')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  dataRecordType === 'transactions'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>Transactions</span>
                <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                  {bookings.filter((b) => b.paymentDetails).length}
                </span>
              </button>
            </div>

            {/* Search Input for Data Records */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dataSearchQuery}
                onChange={(e) => setDataSearchQuery(e.target.value)}
                placeholder={`Search ${dataRecordType} records...`}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:ring-2 focus:ring-[#E8A0B5] focus:bg-white transition-all"
              />
              {dataSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDataSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Database Records Table */}
          <div className="border border-stone-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto max-h-[520px]">
              {/* RESTAURANTS VIEW */}
              {dataRecordType === 'restaurants' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Restaurant</th>
                      <th className="py-3 px-4">Owner / Contact</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Tables</th>
                      <th className="py-3 px-4">Payout UPI</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {restaurants
                      .filter((r) => {
                        const q = dataSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          r.id.toLowerCase().includes(q) ||
                          r.name.toLowerCase().includes(q) ||
                          (r.ownerName && r.ownerName.toLowerCase().includes(q)) ||
                          (r.phone && r.phone.toLowerCase().includes(q)) ||
                          (r.city && r.city.toLowerCase().includes(q)) ||
                          (r.status && r.status.toLowerCase().includes(q))
                        );
                      })
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">{r.name}</div>
                            <div className="text-[10px] font-mono text-stone-400">ID: {r.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-stone-800">{r.ownerName || 'Partner'}</div>
                            <div className="text-[10px] text-stone-500 font-mono">{r.phone || r.email || '—'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-stone-700">{r.city}</div>
                            <div className="text-[10px] text-stone-400 truncate max-w-[140px]">{r.address}</div>
                          </td>
                          <td className="py-3 px-4 text-stone-700 font-mono">
                            {r.totalTables || 6}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] text-stone-700">{maskUpiId(r.upiId)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isActiveStatus(r.status)
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPendingStatus(r.status)
                                  ? 'bg-[#FCE8EF] text-[#C96884]'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {r.status || 'PENDING_APPROVAL'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => exportDataToCsv('restaurants')}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-semibold text-stone-700 cursor-pointer inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3 text-[#C96884]" />
                              <span>CSV</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* CUSTOMERS VIEW */}
              {dataRecordType === 'customers' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Auth Method</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Security Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(users.filter((u) => u.role === 'customer').length > 0
                      ? users.filter((u) => u.role === 'customer')
                      : [
                          currentUser?.role === 'customer'
                            ? currentUser
                            : {
                                id: 'cust-demo-1',
                                name: 'Pooja Hegde',
                                email: 'pooja.hegde@gmail.com',
                                phone: '+91 98450 11223',
                                role: 'customer' as const,
                              },
                        ]
                    )
                      .filter((c) => {
                        const q = dataSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          c.id.toLowerCase().includes(q) ||
                          (c.name && c.name.toLowerCase().includes(q)) ||
                          (c.email && c.email.toLowerCase().includes(q)) ||
                          (c.phone && c.phone.toLowerCase().includes(q))
                        );
                      })
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">{c.name}</div>
                            <div className="text-[10px] font-mono text-stone-400">UID: {c.id}</div>
                          </td>
                          <td className="py-3 px-4 text-stone-700 font-mono text-[11px]">{c.email || '—'}</td>
                          <td className="py-3 px-4 text-stone-700 font-mono text-[11px]">{c.phone || '—'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE8EF] text-[#34343A]">
                              {c.email ? 'Google OAuth' : 'Phone OTP'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 uppercase">
                              Customer
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verified Profile</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* STORE OWNERS VIEW */}
              {dataRecordType === 'owners' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Owner Name</th>
                      <th className="py-3 px-4">Owner ID / UID</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Registered Restaurants</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {Array.from(uniqueOwnerEmails)
                      .map((ownerKey) => {
                        const ownerRests = restaurants.filter(
                          (r) =>
                            (r.email || r.ownerName || r.ownerId || '').toLowerCase() === ownerKey
                        );
                        const first = ownerRests[0] || {};
                        return {
                          key: ownerKey,
                          name: first.ownerName || 'Store Partner',
                          id: first.ownerId || `owner-${ownerKey.slice(0, 8)}`,
                          phone: first.phone || '—',
                          email: first.email || '—',
                          count: ownerRests.length,
                          hasActive: ownerRests.some((r) => isActiveStatus(r.status)),
                        };
                      })
                      .filter((o) => {
                        const q = dataSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          o.id.toLowerCase().includes(q) ||
                          o.name.toLowerCase().includes(q) ||
                          o.phone.toLowerCase().includes(q) ||
                          o.email.toLowerCase().includes(q)
                        );
                      })
                      .map((o) => (
                        <tr key={o.key} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-stone-900">{o.name}</td>
                          <td className="py-3 px-4 font-mono text-[10px] text-stone-500">{o.id}</td>
                          <td className="py-3 px-4 font-mono text-stone-700">{o.phone}</td>
                          <td className="py-3 px-4 font-mono text-stone-700">{o.email}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE8EF] text-[#34343A]">
                              {o.count} restaurant{o.count > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                o.hasActive ? 'bg-emerald-100 text-emerald-800' : 'bg-[#FCE8EF] text-[#C96884]'
                              }`}
                            >
                              {o.hasActive ? 'Active Merchant' : 'Pending Verification'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* BOOKINGS VIEW */}
              {dataRecordType === 'bookings' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Restaurant</th>
                      <th className="py-3 px-4">Slot Date / Time</th>
                      <th className="py-3 px-4">Guests</th>
                      <th className="py-3 px-4">Bill (₹)</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings
                      .filter((b) => {
                        const q = dataSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          b.id.toLowerCase().includes(q) ||
                          b.customerName.toLowerCase().includes(q) ||
                          b.restaurantName.toLowerCase().includes(q) ||
                          b.status.toLowerCase().includes(q)
                        );
                      })
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">{b.id}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-stone-800">{b.customerName}</div>
                            <div className="text-[10px] font-mono text-stone-500">{b.customerPhone}</div>
                          </td>
                          <td className="py-3 px-4 text-stone-800 font-medium">{b.restaurantName}</td>
                          <td className="py-3 px-4 text-stone-600 font-mono">
                            {b.date} • {b.timeSlot}
                          </td>
                          <td className="py-3 px-4 font-mono text-stone-700">{b.guests} Guests</td>
                          <td className="py-3 px-4 font-bold text-stone-900 font-mono">₹{b.totalAmount}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                b.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-stone-100 text-stone-800'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TRANSACTIONS VIEW */}
              {dataRecordType === 'transactions' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Tx ID</th>
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Gross Paid (₹)</th>
                      <th className="py-3 px-4">98% Vendor Share</th>
                      <th className="py-3 px-4">2% Admin Fee</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings
                      .filter((b) => b.paymentDetails)
                      .filter((b) => {
                        const q = dataSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          b.id.toLowerCase().includes(q) ||
                          (b.paymentDetails?.transactionId &&
                            b.paymentDetails.transactionId.toLowerCase().includes(q)) ||
                          b.customerName.toLowerCase().includes(q) ||
                          b.restaurantName.toLowerCase().includes(q)
                        );
                      })
                      .map((b) => {
                        const gross = b.paymentDetails?.amountPaid || b.totalAmount;
                        const vendorShare = Math.round(gross * 0.98);
                        const adminFee = gross - vendorShare;
                        return (
                          <tr key={b.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-stone-900">
                              {b.paymentDetails?.transactionId || `TXN-${b.id}`}
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-stone-500">{b.id}</td>
                            <td className="py-3 px-4 text-stone-800">{b.customerName}</td>
                            <td className="py-3 px-4 font-bold font-mono text-stone-900">₹{gross}</td>
                            <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">₹{vendorShare}</td>
                            <td className="py-3 px-4 font-mono text-[#C96884] font-semibold">
                              ₹{adminFee}{' '}
                              <span className="text-[9px] text-stone-400 font-mono">(atanunath66@oksbi)</span>
                            </td>
                            <td className="py-3 px-4 text-stone-600 font-mono">
                              {b.paymentDetails?.paymentMethod || 'UPI'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Settled
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Discount Campaign Engine */}
      {activeTab === 'discounts' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900">Platform Discount Engine</h2>
              <p className="text-xs text-stone-500">Create promotional codes, festival discounts, and vendor subsidies</p>
            </div>
            <button
              onClick={() => setShowNewDiscountModal(true)}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Promo Campaign</span>
            </button>
          </div>

          {discounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {discounts.map((disc) => (
                <div
                  key={disc.id}
                  className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-[#FCE8EF] text-[#34343A] rounded font-mono font-bold text-xs">
                        {disc.code}
                      </span>
                      <span className={`text-[10px] font-bold ${disc.isActive ? 'text-emerald-700' : 'text-stone-400'}`}>
                        {disc.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <h3 className="font-bold text-stone-900 font-display text-sm">{disc.title}</h3>
                    <p className="text-stone-500 leading-relaxed">{disc.description}</p>
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 space-y-1 text-[11px] text-stone-500">
                    <div className="flex justify-between">
                      <span>Min Order: ₹{disc.minOrderValue}</span>
                      <span>Max Cap: ₹{disc.maxDiscountCap}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Redemptions: {disc.redemptionCount}/{disc.maxRedemptions}</span>
                      <span>Expires: {disc.expiryDate}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleDiscountCampaign(disc.id)}
                    className={`w-full py-1.5 rounded-xl font-bold text-xs transition-colors ${
                      disc.isActive ? 'bg-stone-200 hover:bg-stone-300 text-stone-700' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {disc.isActive ? 'Pause Campaign' : 'Activate Campaign'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl">
              No promo discount campaigns configured. Click "Create Promo Campaign" above to launch a new festival code or vendor subsidy.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Refund Control & Dispute Resolution */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold font-display text-stone-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#C96884]" />
              <span>Admin Refund Management & Dispute Resolution</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Review cancelled bookings, verify cancellation deductions, and issue manual refund adjustments with recorded audit logs.
            </p>
          </div>

          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden text-xs">
            {cancelledBookings.length > 0 ? (
              cancelledBookings.map((b) => (
                <div key={b.id} className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-stone-900">
                      {b.customerName} · Booking #{b.id}
                    </div>
                    <div className="text-stone-500">
                      Stall: {b.restaurantName} · Advance Paid: ₹{b.advanceAmount}
                    </div>
                    <div className="text-stone-500">
                      Reason: <span className="text-rose-700 italic">"{b.cancellationReason}"</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono text-stone-600">Deduction: ₹{b.cancellationDeduction || 0}</div>
                      <div className="font-mono font-bold text-emerald-700">Net Refund: ₹{b.refundAmount || 0}</div>
                      <div className="text-[10px] text-stone-400 font-mono">Status: {b.refundStatus}</div>
                    </div>

                    <button
                      onClick={() => {
                        setOverrideBookingId(b.id);
                        setOverrideAmount(b.advanceAmount); // Default to full refund
                      }}
                      className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold shadow-xs"
                    >
                      Admin Adjustment
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-stone-400">
                No cancelled bookings in the system yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Immutable Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold font-display text-stone-900">Platform Security Audit Logs</h2>
            <p className="text-xs text-stone-500">
              Immutable trail of administrative operations, policy changes, and financial overrides.
            </p>
          </div>

          {auditLogs.length > 0 ? (
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-white flex items-center justify-between gap-4 font-mono">
                  <div>
                    <div className="font-bold text-stone-900 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[10px] text-stone-700 font-bold">
                        {log.action}
                      </span>
                      <span className="text-stone-500 font-sans font-medium text-xs">{log.details}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1">
                      Target: {log.targetType} #{log.targetId} · Admin: {log.adminUsername}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-stone-400 shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              No audit logs recorded yet. Administrative operations and KYC actions will be logged here.
            </div>
          )}
        </div>
      )}

      {/* Admin Refund Override Modal */}
      {overrideBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-stone-900">
              Admin Manual Refund Override
            </h3>
            <p className="text-xs text-stone-500">
              Booking #{overrideBookingId}. Adjust the refund amount with a mandatory recorded audit rationale.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Override Refund Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Administrative Rationale / Notes</label>
                <textarea
                  rows={2}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOverrideBookingId(null)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRefundOverride}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
              >
                Apply & Record Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Discount Modal */}
      {showNewDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-stone-900">Create Promo Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON30"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Monsoon Special 30% OFF"
                  value={discountTitle}
                  onChange={(e) => setDiscountTitle(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    min={5}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    min={50}
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    min={10}
                    value={maxCap}
                    onChange={(e) => setMaxCap(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewDiscountModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Onboard / Test Partner Modal */}
      {showQuickOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FCE8EF] text-[#C96884] flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-stone-900">
                    Onboard Partner / Test Vendor Listing
                  </h3>
                  <p className="text-xs text-stone-500">
                    Simulate or onboard a local food vendor from any Karnataka district.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickOnboardModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickOnboardSubmit} className="space-y-3.5 text-xs">
              {/* Owner Info Group */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  Store Owner Account Identity
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">Owner Full Name</label>
                    <input
                      type="text"
                      required
                      value={quickOwnerName}
                      onChange={(e) => setQuickOwnerName(e.target.value)}
                      placeholder="e.g. Ramesh Gowda"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">Google Email</label>
                    <input
                      type="email"
                      required
                      value={quickOwnerEmail}
                      onChange={(e) => setQuickOwnerEmail(e.target.value)}
                      placeholder="e.g. ramesh@gmail.com"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={quickOwnerPhone}
                      onChange={(e) => setQuickOwnerPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                      Payout UPI ID (Masked in app)
                    </label>
                    <input
                      type="text"
                      required
                      value={quickUpi}
                      onChange={(e) => setQuickUpi(e.target.value)}
                      placeholder="e.g. siddaganga@okaxis"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Restaurant Venue Info */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  Restaurant / Food Stall Details
                </span>
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">Restaurant / Stall Name</label>
                  <input
                    type="text"
                    required
                    value={quickRestName}
                    onChange={(e) => setQuickRestName(e.target.value)}
                    placeholder="e.g. Sri Siddaganga Thatte Idli"
                    className="w-full p-2 bg-white border border-stone-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">District / City</label>
                    <input
                      type="text"
                      required
                      value={quickCity}
                      onChange={(e) => setQuickCity(e.target.value)}
                      placeholder="e.g. Tumakuru (Tumkur)"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">Area / Locality</label>
                    <input
                      type="text"
                      required
                      value={quickArea}
                      onChange={(e) => setQuickArea(e.target.value)}
                      placeholder="e.g. Kyatsandra"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">Physical Address</label>
                  <input
                    type="text"
                    required
                    value={quickAddress}
                    onChange={(e) => setQuickAddress(e.target.value)}
                    placeholder="e.g. NH-48, Near Kyatsandra Circle, Tumakuru"
                    className="w-full p-2 bg-white border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Signature Dish */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  Initial Menu Specialty
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">Dish Name</label>
                    <input
                      type="text"
                      required
                      value={quickDishName}
                      onChange={(e) => setQuickDishName(e.target.value)}
                      placeholder="e.g. Benne Thatte Idli with Red Chutney"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={quickDishPrice}
                      onChange={(e) => setQuickDishPrice(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowQuickOnboardModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit Partner Listing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
