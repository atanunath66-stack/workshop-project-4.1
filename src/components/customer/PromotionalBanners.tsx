import React from 'react';
import { Tag, ShieldCheck, Clock, Store } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PromotionalBanners: React.FC = () => {
  const { discounts } = useApp();

  const activeCampaigns = discounts.filter((d) => d.isActive);

  if (activeCampaigns.length > 0) {
    return (
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCampaigns.slice(0, 2).map((camp) => (
            <div
              key={camp.id}
              className="relative rounded-3xl overflow-hidden bg-[#34343A] text-white min-h-[170px] flex items-center p-6 shadow-sm border border-[#E8E8EC]"
            >
              <div className="relative z-10 max-w-md space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCE8EF] text-[#C96884] rounded-xl text-[11px] font-bold uppercase tracking-wider font-mono">
                  <Tag className="w-3 h-3" />
                  <span>Use Code: {camp.code}</span>
                </div>
                <h2 className="text-xl font-bold font-display leading-tight text-white">
                  {camp.title}
                </h2>
                <p className="text-xs text-[#E5E7EB]">
                  {camp.description} · Min order: ₹{camp.minOrderValue} · Max cap: ₹{camp.maxDiscountCap}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-3xl border border-[#E8E8EC] shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#FCE8EF] text-[#C96884] flex items-center justify-center shrink-0 border border-[#F8D3DF]">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#34343A] font-display">Small Local Food Businesses</div>
            <p className="text-[11px] text-[#777781] mt-0.5">
              Empowering neighborhood stalls and authentic family eateries with digital pre-booking.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-[#E8E8EC] shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#F7F7F8] text-[#34343A] flex items-center justify-center shrink-0 border border-[#E8E8EC]">
            <Clock className="w-4 h-4 text-[#C96884]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#34343A] font-display">Dish Pre-Booking</div>
            <p className="text-[11px] text-[#777781] mt-0.5">
              Select dishes 15 minutes ahead. Food is prepared fresh upon your arrival.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-[#E8E8EC] shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#238B68] flex items-center justify-center shrink-0 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-[#238B68]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#34343A] font-display">50% Advance & Fair Refunds</div>
            <p className="text-[11px] text-[#777781] mt-0.5">
              Transparent cancellation deductions displayed upfront before checkout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
