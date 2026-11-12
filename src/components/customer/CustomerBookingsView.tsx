import React, { useState } from 'react';
import {
  FileText,
  Navigation,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../types';
import { calculateCancellationRefund } from '../../utils/cancellationAndPricing';
import { DigitalReceiptModal } from '../common/DigitalReceiptModal';

interface Props {
  onDiscoverMore: () => void;
}

export const CustomerBookingsView: React.FC<Props> = ({ onDiscoverMore }) => {
  const {
    isLoggedIn,
    loginUser,
    openGoogleSignIn,
    bookings,
    currentUser,
    cancelCustomerBooking,
    toggleLocationSharing,
    setReceiptModalBooking,
    receiptModalBooking,
    setIsAuthModalOpen,
    setAuthModalRole,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');

  // Cancellation modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Change of plans / Emergency');

  if (!isLoggedIn || currentUser.role !== 'customer') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E8EC] shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#FCE8EF] text-[#C96884] flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-display text-[#34343A]">
              Sign In to View Bookings & Receipts
            </h1>
            <p className="text-xs text-[#777781] max-w-sm mx-auto leading-relaxed">
              Track your live food stall reservations, arrival countdowns, and download official digital GST receipts.
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
              className="w-full py-3 px-4 bg-[#34343A] hover:bg-[#232328] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Sign In with Phone OTP / Email
            </button>

            <button
              type="button"
              onClick={onDiscoverMore}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors pt-2 inline-block font-medium cursor-pointer"
            >
              ← Back to Local Food Discovery
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userBookings = bookings.filter((b) => b.customerId === currentUser.id);

  const filteredBookings = userBookings.filter((b) => {
    if (filter === 'active') {
      return ['PENDING', 'ACCEPTED', 'CUSTOMER ARRIVING', 'ARRIVED', 'SERVED'].includes(b.status);
    }
    if (filter === 'completed') {
      return b.status === 'COMPLETED';
    }
    if (filter === 'cancelled') {
      return ['CANCELLED', 'REJECTED'].includes(b.status);
    }
    return true;
  });

  const handleConfirmCancel = () => {
    if (!cancellingBooking) return;
    cancelCustomerBooking(cancellingBooking.id, cancelReason);
    setCancellingBooking(null);
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">Waiting for Vendor</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">Accepted · Ready for Advance</span>;
      case 'CUSTOMER ARRIVING':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold animate-pulse">Confirmed · Arriving</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold">Seated at Venue</span>;
      case 'SERVED':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">Food Served</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold">Cancelled & Refunded</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold">Declined by Vendor</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900">
            My Bookings & Invoices
          </h1>
          <p className="text-xs text-stone-500">
            Track live stall arrival, GPS location sharing, digital tax receipts & refunds
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'active' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Active Orders ({userBookings.filter((b) => ['PENDING', 'ACCEPTED', 'CUSTOMER ARRIVING', 'ARRIVED', 'SERVED'].includes(b.status)).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'completed' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'cancelled' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Cancelled / Refunds
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#E8E8EC] max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FCE8EF] text-[#C96884] flex items-center justify-center mx-auto text-xl">
            🎫
          </div>
          <h2 className="font-bold text-[#34343A] font-display text-base">No {filter} bookings</h2>
          <p className="text-xs text-[#777781]">
            Discover local food stalls, pre-book dishes with 50% advance, and skip waiting lines.
          </p>
          <button
            onClick={onDiscoverMore}
            className="px-4 py-2 bg-[#34343A] hover:bg-[#232328] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Discover Nearby Gems
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBookings.map((bkg) => {
            const isActive = ['PENDING', 'ACCEPTED', 'CUSTOMER ARRIVING', 'ARRIVED', 'SERVED'].includes(bkg.status);

            return (
              <div
                key={bkg.id}
                className="bg-white rounded-3xl border border-[#E8E8EC] shadow-xs hover:shadow-md transition-shadow p-6 space-y-5 flex flex-col justify-between"
              >
                {/* Header Strip */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono font-semibold text-stone-400">
                      ID: #{bkg.id} · {bkg.receiptNumber}
                    </div>
                    <h3 className="text-lg font-bold font-display text-stone-900 mt-0.5">
                      {bkg.restaurantName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C96884] shrink-0" />
                      <span className="truncate max-w-[280px]">{bkg.restaurantAddress}</span>
                    </div>
                  </div>

                  {getStatusBadge(bkg.status)}
                </div>

                {/* Timing & Guests */}
                <div className="grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-2xl text-xs border border-stone-100">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Arrival</span>
                    <div className="font-bold text-stone-800 mt-0.5">{bkg.arrivalTime}</div>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Guests & Table</span>
                    <div className="font-bold text-stone-800 mt-0.5">{bkg.numberOfGuests} Guests</div>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">Advance Paid</span>
                    <div className="font-bold font-mono text-emerald-700 mt-0.5">₹{bkg.advanceAmount}</div>
                  </div>
                </div>

                {/* Ordered items preview */}
                {bkg.items.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-stone-700 text-[11px] uppercase tracking-wider">
                      Pre-Ordered Items ({bkg.items.length}):
                    </span>
                    <div className="space-y-1">
                      {bkg.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-stone-700">
                          <span className="truncate max-w-[240px]">
                            {it.quantity}x {it.name}
                          </span>
                          <span className="font-mono text-stone-500">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live GPS Sharing Toggle (If Active) */}
                {isActive && (
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Navigation className={`w-4 h-4 ${bkg.customerLocationShared ? 'text-purple-600 animate-spin' : 'text-stone-400'}`} />
                      <div>
                        <div className="font-bold text-purple-950">
                          {bkg.customerLocationShared ? 'Live GPS Shared with Vendor' : 'Share Live GPS with Stall'}
                        </div>
                        <div className="text-[11px] text-purple-700">
                          {bkg.customerLocationShared
                            ? 'Vendor sees your ETA to serve dishes piping hot'
                            : 'Help the chef prepare hot food exactly as you arrive'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleLocationSharing(bkg.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        bkg.customerLocationShared
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      {bkg.customerLocationShared ? 'Sharing ON' : 'Share GPS'}
                    </button>
                  </div>
                )}

                {/* Cancellation & Refund Record if Cancelled */}
                {bkg.status === 'CANCELLED' && (
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>Cancelled Booking</span>
                      <span className="text-emerald-700">Refund: ₹{bkg.refundAmount || 0}</span>
                    </div>
                    <div className="text-[11px] text-rose-800">
                      Deduction applied: ₹{bkg.cancellationDeduction || 0} · Reason: {bkg.cancellationReason}
                    </div>
                    {bkg.refundTransactionId && (
                      <div className="text-[10px] font-mono text-stone-500">
                        Razorpay Refund ID: {bkg.refundTransactionId}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {/* Digital Tax Receipt CTA */}
                  <button
                    onClick={() => setReceiptModalBooking(bkg)}
                    className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span>Digital Receipt</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Cancellation Trigger button if active */}
                    {isActive && (
                      <button
                        onClick={() => setCancellingBooking(bkg)}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}

                    <a
                      href={`https://maps.google.com/?q=${bkg.restaurantAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal with Real-time Deduction Calculation */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="font-bold text-stone-900 font-display text-base">
                Cancel Booking #{cancellingBooking.id}?
              </h2>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              We understand plans change. Here is the transparent refund calculation as per{' '}
              <span className="font-semibold">{cancellingBooking.restaurantName}'s</span> cancellation policy:
            </p>

            {/* Refund Math Snapshot */}
            {(() => {
              const calc = calculateCancellationRefund(
                cancellingBooking.paymentStatus === 'PENDING' ? 0 : cancellingBooking.advanceAmount,
                cancellingBooking.cancellationPolicySnapshot,
                15 // simulated 15 mins before arrival
              );

              return (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Advance Paid Online:</span>
                    <span className="font-mono font-semibold">₹{calc.advancePaid}</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>Policy Cancellation Charge:</span>
                    <span className="font-mono font-semibold">-₹{calc.deductionAmount}</span>
                  </div>
                  <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-sm text-emerald-700">
                    <span>Net Refund to Source:</span>
                    <span className="font-mono">₹{calc.refundAmount}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 pt-1 leading-snug">{calc.policySummary}</p>
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-bold text-[#25152F] mb-1">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-white border-2 border-[#DDD4E2] focus:border-[#A8B88A] rounded-xl text-xs font-bold text-[#25152F]"
              >
                <option>Change of plans / Emergency</option>
                <option>Running too late</option>
                <option>Booked by mistake</option>
                <option>Found an alternative place</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm & Process Refund</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        booking={receiptModalBooking}
        onClose={() => setReceiptModalBooking(null)}
      />
    </div>
  );
};
