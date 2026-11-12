import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  ShieldAlert,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Restaurant, MenuItem, Booking } from '../../types';
import { useApp } from '../../context/AppContext';
import { PaymentModal } from '../common/PaymentModal';
import { GoogleMapCard } from '../common/GoogleMapCard';

interface Props {
  restaurant: Restaurant;
  onBack: () => void;
  onBookingCreated: (booking: Booking) => void;
}

export const RestaurantDetailsPage: React.FC<Props> = ({
  restaurant,
  onBack,
  onBookingCreated,
}) => {
  const {
    reviews,
    createBooking,
    customerPayAdvance,
    requireAuth,
    addCustomerReview,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'menu' | 'overview' | 'reviews' | 'policy'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Pre-order cart & booking state
  const [cart, setCart] = useState<{ [itemId: string]: { item: MenuItem; quantity: number; notes: string } }>({});
  const [bookingType, setBookingType] = useState<'table_only' | 'dish_preorder' | 'table_and_dishes'>('table_and_dishes');
  const [guests, setGuests] = useState<number>(2);
  const [seating, setSeating] = useState<string>('Indoor / Main Counter');
  const [arrivalDate, setArrivalDate] = useState<string>('2026-11-09');
  const [arrivalTime, setArrivalTime] = useState<string>('In 15 mins');
  const [advancePercent, setAdvancePercent] = useState<number>(50);
  const [discountCode, setDiscountCode] = useState<string>('GULLY20');

  // Active Razorpay checkout modal
  const [pendingPaymentBooking, setPendingPaymentBooking] = useState<Booking | null>(null);

  // New review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [ambienceRating, setAmbienceRating] = useState(4);
  const [reviewComment, setReviewComment] = useState('');

  const restaurantReviews = reviews.filter((r) => r.restaurantId === restaurant.id);
  const policy = restaurant.cancellationPolicy;

  // Cart helper functions
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const current = prev[item.id];
      if (current) {
        return {
          ...prev,
          [item.id]: { ...current, quantity: current.quantity + 1 },
        };
      }
      return {
        ...prev,
        [item.id]: { item, quantity: 1, notes: '' },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...current, quantity: current.quantity - 1 },
      };
    });
  };

  const updateCartNotes = (itemId: string, notes: string) => {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: { ...current, notes },
      };
    });
  };

  const cartItemsList = Object.values(cart);
  const cartSubtotal = cartItemsList.reduce((acc, c) => acc + c.item.price * c.quantity, 0);

  const handleProceedToBooking = () => {
    requireAuth(() => {
      const formattedItems = cartItemsList.map((c) => ({
        menuItemId: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        notes: c.notes,
        isVeg: c.item.isVeg,
      }));

      const finalType = cartItemsList.length > 0 ? bookingType : 'table_only';

      const newBooking = createBooking(
        restaurant.id,
        finalType,
        guests,
        seating,
        arrivalDate,
        arrivalTime,
        formattedItems,
        advancePercent,
        discountCode
      );

      // Open payment modal for advance payment
      setPendingPaymentBooking(newBooking);
    }, 'customer');
  };

  const handlePaymentSuccess = (
    bookingId: string,
    method: string,
    upiApp?: 'gpay' | 'phonepe' | 'custom_upi',
    verifiedDetails?: { paymentId?: string; orderId?: string }
  ) => {
    customerPayAdvance(bookingId, method, upiApp, verifiedDetails);
    if (pendingPaymentBooking) {
      onBookingCreated({
        ...pendingPaymentBooking,
        status: 'CONFIRMED',
        paymentStatus: 'ADVANCE_PAID',
        paymentDetails: {
          transactionId: verifiedDetails?.paymentId,
          orderId: verifiedDetails?.orderId,
          amountPaid: pendingPaymentBooking.advanceAmount,
          paymentMethod: method,
          status: 'SUCCESS',
        },
      });
    }
  };

  const menuCategories = Array.from(new Set(restaurant.menu.map((m) => m.category)));

  const filteredMenu = restaurant.menu.filter((m) => {
    if (selectedCategory !== 'All' && m.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F7F8] pb-16">
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-[#E8E8EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1 font-semibold text-stone-800 hover:text-[#C96884] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to discovery</span>
            </button>
            <span className="text-stone-300">/</span>
            <span>{restaurant.city}</span>
            <span className="text-stone-300">/</span>
            <span>{restaurant.area}</span>
            <span className="text-stone-300">/</span>
            <span className="font-semibold text-stone-900 truncate max-w-[150px] sm:max-w-none">{restaurant.name}</span>
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: restaurant.name, url: window.location.href }).catch(() => {});
              } else if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="flex items-center gap-1 hover:text-stone-900 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Photo Mosaic Gallery (Matching Magicpin Screenshot 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-3xl overflow-hidden shadow-sm bg-stone-200 aspect-[16/7] min-h-[260px] md:min-h-[340px]">
          {/* Main Large Left Photo */}
          <div className="md:col-span-2 relative h-full">
            <img
              src={restaurant.coverImage}
              alt={restaurant.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
          </div>

          {/* Stacked Right Photos */}
          <div className="hidden md:grid grid-rows-2 gap-3 h-full">
            <div className="relative h-full overflow-hidden">
              <img
                src={restaurant.galleryImages[1] || restaurant.coverImage}
                alt={`${restaurant.name} gallery 1`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative h-full overflow-hidden bg-stone-900">
              <img
                src={restaurant.galleryImages[0] || restaurant.coverImage}
                alt={`${restaurant.name} gallery 2`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-xl font-bold font-display">+18</span>
                <span className="text-xs uppercase tracking-wider font-semibold">Stall Photos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Title & Key Bar */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E8E8EC] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#34343A] font-display">
                  {restaurant.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#238B68] text-white rounded-xl text-xs font-bold shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{restaurant.averageRating}</span>
                  <span className="opacity-75">({restaurant.totalReviews})</span>
                </span>
              </div>
              <p className="text-xs text-[#777781] mt-1">{restaurant.tagline}</p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${restaurant.phone}`}
                className="px-3.5 py-2 border border-[#E8E8EC] hover:bg-[#FCE8EF]/40 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>Call Stall</span>
              </a>

              <a
                href={`https://maps.google.com/?q=${restaurant.lat},${restaurant.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 border border-[#E8E8EC] hover:bg-[#FCE8EF]/40 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C96884]" />
                <span>Get Directions</span>
              </a>

              <button
                onClick={() => {
                  setActiveTab('menu');
                  const elem = document.getElementById('booking-section');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E8A0B5]" />
                <span>Pre-Book Table & Dishes</span>
              </button>
            </div>
          </div>

          {/* Clean Unboxed Details Strip */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#777781] pt-3 border-t border-[#E8E8EC]">
            <div className="flex items-center gap-1 text-[#238B68] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Open Now · {restaurant.openingTime} – {restaurant.closingTime}</span>
            </div>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>{restaurant.address}</span>
            </div>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span>₹{restaurant.priceForTwo} for two</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="font-semibold text-[#C96884]">{restaurant.availableTables} Tables Available</span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E8E8EC] pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'menu' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/50 hover:text-stone-900'
            }`}
          >
            Menu & Pre-Order Dishes
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/50 hover:text-stone-900'
            }`}
          >
            Venue Overview & Facilities
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'reviews' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/50 hover:text-stone-900'
            }`}
          >
            Customer Reviews ({restaurantReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'policy' ? 'bg-[#34343A] text-white shadow-xs' : 'text-[#777781] hover:bg-[#FCE8EF]/50 hover:text-stone-900'
            }`}
          >
            Cancellation Policy & Refunds
          </button>
        </div>

        {/* Tab 1: Menu & Pre-Order */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Menu Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Category pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-stone-900 text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  All Items
                </button>
                {menuCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-stone-900 text-white'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu items list */}
              <div className="space-y-4">
                {filteredMenu.map((item) => {
                  const inCart = cart[item.id];
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                          />
                          <h3 className="font-bold text-stone-900 text-sm font-display">
                            {item.name}
                          </h3>
                          {item.bestseller && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              Bestseller
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-bold font-mono text-stone-900">
                          ₹{item.price}
                        </div>

                        <p className="text-xs text-stone-500 leading-relaxed max-w-lg">
                          {item.description}
                        </p>

                        <div className="text-[11px] text-stone-400 flex items-center gap-1 pt-1">
                          <Clock className="w-3 h-3" />
                          <span>Ready in ~{item.prepTimeMinutes} mins</span>
                        </div>
                      </div>

                      {/* Add Button & Image */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {inCart ? (
                          <div className="flex items-center gap-2 bg-[#FCE8EF] border border-[#E8A0B5] rounded-xl p-1">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-6 h-6 rounded-lg bg-white text-stone-800 flex items-center justify-center font-bold hover:bg-stone-100 shadow-xs cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-stone-900 font-mono">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-6 h-6 rounded-lg bg-[#34343A] text-white flex items-center justify-center font-bold hover:bg-stone-800 shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-4 py-1.5 bg-white border border-[#34343A] text-stone-800 hover:bg-[#FCE8EF] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Add +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Booking & Pre-Order Sidebar */}
            <div id="booking-section" className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E8E8EC] space-y-5 sticky top-28">
                <div className="border-b border-[#E8E8EC] pb-3">
                  <h3 className="font-bold text-[#34343A] font-display text-base">
                    Pre-Book Table & Dishes
                  </h3>
                  <p className="text-xs text-[#777781]">
                    Skip waiting lines · Prepared hot on your arrival
                  </p>
                </div>

                {/* Booking Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-700">Reservation Type</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setBookingType('table_and_dishes')}
                      className={`py-2 px-2.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                        bookingType === 'table_and_dishes'
                          ? 'border-stone-900 bg-[#FCE8EF] text-stone-900'
                          : 'border-[#E8E8EC] text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      Table + Pre-Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType('table_only')}
                      className={`py-2 px-2.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                        bookingType === 'table_only'
                          ? 'border-stone-900 bg-[#FCE8EF] text-stone-900'
                          : 'border-[#E8E8EC] text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      Table Only
                    </button>
                  </div>
                </div>

                {/* Date & Guests */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-[#25152F] block mb-1">Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border-2 border-[#DDD4E2] focus:border-[#A8B88A] rounded-xl text-xs font-bold text-[#25152F] shadow-2xs"
                    >
                      <option value={1}>1 Person</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4 Guests</option>
                      <option value={6}>6+ Family</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-[#25152F] block mb-1">Arrival Time</label>
                    <select
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full p-2.5 bg-white border-2 border-[#DDD4E2] focus:border-[#A8B88A] rounded-xl text-xs font-bold text-[#25152F] shadow-2xs"
                    >
                      <option value="In 15 mins">In 15 mins</option>
                      <option value="In 30 mins">In 30 mins</option>
                      <option value="In 45 mins">In 45 mins</option>
                      <option value="07:30 PM">07:30 PM</option>
                      <option value="08:00 PM">08:00 PM</option>
                      <option value="08:30 PM">08:30 PM</option>
                    </select>
                  </div>
                </div>

                {/* Seating preference */}
                <div className="text-xs">
                  <label className="font-bold text-[#25152F] block mb-1">Seating Preference</label>
                  <select
                    value={seating}
                    onChange={(e) => setSeating(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#DDD4E2] focus:border-[#A8B88A] rounded-xl text-xs font-bold text-[#25152F] shadow-2xs"
                  >
                    <option value="Indoor / Main Counter">Indoor / Main Counter</option>
                    <option value="Outdoor Street Bench">Outdoor Street Bench</option>
                    <option value="AC Family Room">AC Family Room</option>
                  </select>
                </div>

                {/* Pre-Ordered Items Summary */}
                <div className="space-y-2 pt-2 border-t border-[#DDD4E2] text-xs">
                  <div className="flex items-center justify-between font-bold text-[#25152F]">
                    <span>Pre-Ordered Dishes ({cartItemsList.length})</span>
                    <span className="font-mono text-[#25152F]">₹{cartSubtotal}</span>
                  </div>

                  {cartItemsList.length > 0 ? (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {cartItemsList.map((c) => (
                        <div key={c.item.id} className="p-2.5 bg-[#F7F2EA] border border-[#DDD4E2] rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#25152F] truncate max-w-[140px]">
                              {c.item.name}
                            </span>
                            <span className="font-mono font-bold text-[#25152F]">
                              {c.quantity} x ₹{c.item.price}
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder="Special notes (e.g. less spicy)..."
                            value={c.notes}
                            onChange={(e) => updateCartNotes(c.item.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#DDD4E2] focus:border-[#A8B88A] rounded-lg text-[#25152F] font-bold placeholder:text-[#5A4B63]"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#5A4B63] italic">
                      No dishes added yet. You can pre-order food to have it ready upon arrival!
                    </p>
                  )}
                </div>

                {/* Promo Coupon */}
                <div className="pt-2 text-xs">
                  <label className="font-bold text-[#25152F] block mb-1">Apply Discount Coupon</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="e.g. GULLY20"
                      className="flex-1 px-3 py-2 bg-white border-2 border-[#DDD4E2] focus:border-[#A8B88A] rounded-xl font-mono font-bold text-[#25152F] uppercase placeholder:text-[#5A4B63]"
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-[#25152F] hover:bg-[#1A0F21] text-white font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  <div className="text-[10px] text-emerald-800 mt-1 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Coupon GULLY20 applied (20% OFF)</span>
                  </div>
                </div>

                {/* Advance Payment Option (50% or 100%) */}
                <div className="space-y-2 pt-2 border-t border-[#DDD4E2] text-xs">
                  <label className="font-bold text-[#25152F] block">Payment Option</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdvancePercent(50)}
                      className={`p-2.5 rounded-xl border-2 text-center font-bold transition-all cursor-pointer ${
                        advancePercent === 50
                          ? 'border-[#25152F] bg-[#F7F2EA] text-[#25152F] shadow-xs'
                          : 'border-[#DDD4E2] bg-white text-[#5A4B63] hover:text-[#25152F]'
                      }`}
                    >
                      <div>50% Advance</div>
                      <div className="text-[10px] text-[#5A4B63] font-normal">Pay rest at venue</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdvancePercent(100)}
                      className={`p-2.5 rounded-xl border-2 text-center font-bold transition-all cursor-pointer ${
                        advancePercent === 100
                          ? 'border-[#25152F] bg-[#F7F2EA] text-[#25152F] shadow-xs'
                          : 'border-[#DDD4E2] bg-white text-[#5A4B63] hover:text-[#25152F]'
                      }`}
                    >
                      <div>100% Full</div>
                      <div className="text-[10px] text-[#5A4B63] font-normal">Cashless visit</div>
                    </button>
                  </div>
                </div>

                {/* Upfront Cancellation Policy Notice */}
                <div className="p-3 bg-[#F7F2EA] rounded-2xl border border-[#DDD4E2] text-[11px] text-[#25152F] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#25152F]">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#B96D79] shrink-0" />
                    <span>Cancellation Policy</span>
                  </div>
                  <p className="text-[#5A4B63] leading-relaxed">{policy.termsText}</p>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handleProceedToBooking}
                  className="w-full py-3.5 px-4 bg-[#A8B88A] hover:bg-[#97A779] text-[#25152F] rounded-2xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#8C9C6F]"
                >
                  <span>Request Booking &amp; Pay Advance</span>
                  <ChevronRight className="w-4 h-4 text-[#25152F]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Overview & Facilities */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900">About {restaurant.name}</h2>
              <p className="text-sm text-stone-600 leading-relaxed mt-2 max-w-3xl">
                {restaurant.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold font-display text-stone-900 mb-3">Available Facilities</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.facilities.map((fac) => (
                  <span
                    key={fac}
                    className="px-3 py-1.5 bg-stone-100 text-stone-800 rounded-xl text-xs font-semibold"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-display text-[#34343A] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C96884]" />
                    Restaurant Location & Directions
                  </h3>
                  <p className="text-xs text-[#777781] mt-0.5">
                    {restaurant.location?.formattedAddress || `${restaurant.address}, ${restaurant.area}, ${restaurant.city}`}
                  </p>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.location?.latitude ?? restaurant.lat},${restaurant.location?.longitude ?? restaurant.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#C96884] hover:bg-[#b25771] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>GET DIRECTIONS</span>
                </a>
              </div>

              {/* Live Google Map Container */}
              <div className="rounded-2xl overflow-hidden border border-[#E8E8EC] shadow-2xs">
                <GoogleMapCard
                  center={{
                    lat: restaurant.location?.latitude ?? restaurant.lat,
                    lng: restaurant.location?.longitude ?? restaurant.lng,
                  }}
                  zoom={15}
                  height="260px"
                  markers={[
                    {
                      id: restaurant.id,
                      lat: restaurant.location?.latitude ?? restaurant.lat,
                      lng: restaurant.location?.longitude ?? restaurant.lng,
                      title: restaurant.name,
                      subtitle: restaurant.area,
                      price: restaurant.priceForTwo,
                      rating: restaurant.averageRating,
                      image: restaurant.coverImage,
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Reviews */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-bold font-display text-stone-900">Verified Customer Reviews</h2>
                <p className="text-xs text-stone-500">Only verified diners with completed bookings can review</p>
              </div>

              <button
                onClick={() => {
                  requireAuth(() => {
                    setShowReviewForm(!showReviewForm);
                  }, 'customer');
                }}
                className="px-4 py-2 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Write a Review
              </button>
            </div>

            {/* Review form */}
            {showReviewForm && (
              <div className="p-4 bg-[#FCE8EF]/40 rounded-2xl border border-[#E8A0B5]/40 space-y-3">
                <h3 className="text-xs font-bold text-stone-900">Rate your completed dining experience</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-stone-600 block mb-1">Overall (1-5)</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-stone-600 block mb-1">Food Taste</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={foodRating}
                      onChange={(e) => setFoodRating(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-stone-600 block mb-1">Service</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={serviceRating}
                      onChange={(e) => setServiceRating(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-stone-600 block mb-1">Ambience</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={ambienceRating}
                      onChange={(e) => setAmbienceRating(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell foodies about the taste, portion size, and hygiene..."
                  className="w-full p-3 text-xs bg-white border border-stone-200 rounded-xl"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-3 py-1.5 text-xs text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!reviewComment.trim()) return;
                      requireAuth(() => {
                        addCustomerReview(
                          restaurant.id,
                          `visit-${Date.now()}`,
                          reviewRating,
                          foodRating,
                          serviceRating,
                          ambienceRating,
                          reviewComment
                        );
                        setShowReviewForm(false);
                        setReviewComment('');
                      }, 'customer');
                    }}
                    className="px-4 py-1.5 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Submit Verified Review
                  </button>
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
              {restaurantReviews.length > 0 ? (
                restaurantReviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-white rounded-2xl border border-[#E8E8EC] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#FCE8EF] text-[#C96884] flex items-center justify-center font-bold text-xs">
                          {rev.customerName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900 text-xs flex items-center gap-1.5">
                            <span>{rev.customerName}</span>
                            {rev.verifiedDiner && (
                              <span className="text-[10px] text-[#238B68] bg-[#238B68]/10 px-1.5 py-0.5 rounded font-bold">
                                Verified Diner
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-[#238B68] bg-white px-2 py-1 rounded-lg border border-[#E8E8EC]">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed">{rev.comment}</p>

                    <div className="flex items-center gap-3 text-[11px] text-stone-400 pt-1 border-t border-stone-100">
                      <span>Food: {rev.foodRating}/5</span>
                      <span>·</span>
                      <span>Service: {rev.serviceRating}/5</span>
                      <span>·</span>
                      <span>Ambience: {rev.ambienceRating}/5</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 italic">No reviews yet for this stall. Be the first to dine and review!</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Cancellation Policy & Refund Terms */}
        {activeTab === 'policy' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E8EC] shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold font-display text-[#34343A] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#C96884]" />
                <span>Venue Cancellation & Partial Refund Rules</span>
              </h2>
              <p className="text-xs text-[#777781] mt-1">
                Configured transparently by the store owner to prevent food wastage while protecting customer advances.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <span className="text-stone-400 uppercase tracking-wider text-[10px] font-semibold">Deduction Rule</span>
                <div className="text-base font-bold text-stone-900">
                  {policy.type === 'fixed' ? `₹${policy.deductionValue} Fixed Charge` : `${policy.deductionValue}% Deduction`}
                </div>
                <p className="text-stone-500 text-[11px]">Minimum deduction: ₹{policy.minDeductionCharge}</p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <span className="text-stone-400 uppercase tracking-wider text-[10px] font-semibold">Free Cancellation</span>
                <div className="text-base font-bold text-stone-900">
                  Up to {policy.freeCancellationDeadlineMinutes} mins
                </div>
                <p className="text-stone-500 text-[11px]">100% advance refunded before this window</p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <span className="text-stone-400 uppercase tracking-wider text-[10px] font-semibold">Refund Channel</span>
                <div className="text-base font-bold text-emerald-700">
                  Original Payment Method
                </div>
                <p className="text-stone-500 text-[11px]">Direct Razorpay refund settlement</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2">
              <h3 className="font-bold">Official Policy Statement</h3>
              <p className="leading-relaxed">{policy.termsText}</p>
              <div className="text-[11px] text-amber-900 italic pt-1 border-t border-amber-200/60">
                * Note: Never deducts more than the advance actually paid by the customer.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UPI Intent & QR Checkout Modal */}
      <PaymentModal
        isOpen={Boolean(pendingPaymentBooking)}
        booking={pendingPaymentBooking}
        restaurant={restaurant}
        onClose={() => setPendingPaymentBooking(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
