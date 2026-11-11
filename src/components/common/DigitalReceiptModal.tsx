import React, { useRef } from 'react';
import { X, Printer, Share2, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { Booking } from '../../types';

interface Props {
  booking: Booking | null;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<Props> = ({ booking, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Digital Receipt - ${booking.receiptNumber}`,
        text: `Receipt for ${booking.restaurantName} (Order #${booking.id}) - Total: ₹${booking.totalAmount}`,
        url: window.location.href,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `AlooKhaoge Digital Receipt: ${booking.receiptNumber}\nVenue: ${booking.restaurantName}\nTotal Paid: ₹${booking.totalAmount}\nBooking ID: ${booking.id}`
      );
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Receipt Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base tracking-tight text-[#E8A0B5]">ALOOKHAOGE</span>
            <span className="text-xs text-stone-400">· Official Tax Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              aria-label="Print receipt"
              className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              aria-label="Share receipt"
              className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
              title="Share Receipt"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close digital receipt"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div ref={receiptRef} className="p-6 md:p-8 space-y-6 bg-white text-stone-800 print:p-0 overflow-y-auto flex-1">
          {/* Top Status */}
          <div className="text-center pb-6 border-b border-dashed border-stone-200">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-display text-stone-900">Digital Tax Invoice</h1>
            <p className="text-xs text-stone-500 mt-0.5">Verified Local Dine-in & Pre-Booking Record</p>

            <div className="mt-3 inline-block px-3 py-1 bg-stone-100 rounded-lg text-xs font-mono font-medium text-stone-700">
              Receipt No: {booking.receiptNumber}
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-stone-400 uppercase tracking-wider text-[10px] font-semibold">Billed To</div>
              <div className="font-semibold text-stone-900 mt-0.5">{booking.customerName}</div>
              <div className="text-stone-500">{booking.customerPhone}</div>
              <div className="text-stone-500">{booking.customerEmail}</div>
            </div>
            <div className="text-right">
              <div className="text-stone-400 uppercase tracking-wider text-[10px] font-semibold">Restaurant Venue</div>
              <div className="font-semibold text-stone-900 mt-0.5">{booking.restaurantName}</div>
              <div className="text-stone-500 truncate max-w-[200px] ml-auto">{booking.restaurantAddress}</div>
              <div className="text-stone-500 mt-1">Arrival: {booking.arrivalDate} · {booking.arrivalTime}</div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-stone-200 rounded-2xl overflow-hidden">
            <div className="bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-600 grid grid-cols-12 gap-2 border-b border-stone-200">
              <span className="col-span-7">Item Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-3 text-right">Amount</span>
            </div>
            <div className="divide-y divide-stone-100 text-xs">
              {booking.items.length > 0 ? (
                booking.items.map((item, idx) => (
                  <div key={idx} className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7">
                      <div className="font-medium text-stone-900 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.notes && <p className="text-[11px] text-stone-400 italic">"{item.notes}"</p>}
                    </div>
                    <div className="col-span-2 text-center text-stone-600 font-mono">x{item.quantity}</div>
                    <div className="col-span-3 text-right font-medium text-stone-900 font-mono">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-stone-500 italic">Table reservation without pre-ordered items</div>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-2 text-xs pt-2">
            <div className="flex justify-between text-stone-600">
              <span>Item Subtotal</span>
              <span className="font-mono">₹{booking.subtotal}</span>
            </div>
            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount ({booking.discountCode || 'Promo applied'})</span>
                <span className="font-mono">-₹{booking.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>GST (5% Indian Food Service)</span>
              <span className="font-mono">₹{booking.taxes}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Platform & Hyperlocal Convenience Fee</span>
              <span className="font-mono">₹{booking.platformFee}</span>
            </div>

            <div className="border-t border-dashed border-stone-200 pt-2 flex justify-between text-sm font-bold text-stone-900">
              <span>Total Bill Amount</span>
              <span className="font-mono">₹{booking.totalAmount}</span>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 mt-3 border border-stone-100 text-xs">
              <div className="flex justify-between text-stone-700">
                <span>Advance Paid Online (Razorpay)</span>
                <span className="font-mono font-semibold text-emerald-700">₹{booking.advanceAmount}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Remaining Counter Balance</span>
                <span className="font-mono font-semibold text-stone-900">
                  {booking.paymentStatus === 'FULLY_PAID' ? '₹0 (Settled)' : `₹${booking.remainingAmount}`}
                </span>
              </div>
              {booking.cancellationDeduction !== undefined && booking.cancellationDeduction > 0 && (
                <div className="flex justify-between text-amber-800 font-medium border-t border-stone-200 pt-1">
                  <span>Cancellation Deduction Applied</span>
                  <span className="font-mono">₹{booking.cancellationDeduction}</span>
                </div>
              )}
              {booking.refundAmount !== undefined && booking.refundAmount > 0 && (
                <div className="flex justify-between text-blue-700 font-medium">
                  <span>Net Refund Processed ({booking.refundStatus})</span>
                  <span className="font-mono">₹{booking.refundAmount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Verification Footer & QR simulator */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 border border-stone-300 rounded-lg flex items-center justify-center font-mono text-[9px] text-stone-400 p-1 text-center bg-stone-50">
                [QR-AUTH]
              </div>
              <div>
                <div className="font-semibold text-stone-700">Booking ID: {booking.id}</div>
                <div className="text-[11px]">Status: {booking.status} · {booking.paymentStatus}</div>
              </div>
            </div>
            <div className="text-right flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Razorpay Verified</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Receipt</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download / Print PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
