import React from 'react';
import { Star, MapPin, Clock, ShieldAlert } from 'lucide-react';
import { Restaurant } from '../../types';

interface Props {
  restaurant: Restaurant;
  onClick: () => void;
}

export const RestaurantCard: React.FC<Props> = ({ restaurant, onClick }) => {
  const policy = restaurant.cancellationPolicy;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-3xl border border-[#E8E8EC] hover:border-[#E8A0B5] shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F7F7F8]">
        <img
          src={restaurant.coverImage}
          alt={restaurant.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {restaurant.discountOffer ? (
            <div className="px-2.5 py-1 bg-[#FCE8EF] text-[#C96884] border border-[#F8D3DF] rounded-xl text-xs font-bold shadow-xs">
              {restaurant.discountOffer}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1 px-2.5 py-0.5 bg-white/90 backdrop-blur-xs text-[#34343A] border border-[#E8E8EC] rounded-xl text-xs font-bold shadow-xs">
            <Star className="w-3 h-3 fill-[#E8A0B5] text-[#E8A0B5]" />
            <span>{restaurant.averageRating || '4.5'}</span>
          </div>
        </div>

        {/* Facilities Overlay Pill */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1.5 text-[11px] text-white/95 drop-shadow-md overflow-hidden font-medium">
          <Clock className="w-3 h-3 shrink-0" />
          <span className="truncate">{restaurant.openingTime} – {restaurant.closingTime}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[#34343A] text-base font-display group-hover:text-[#C96884] transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
          </div>

          <p className="text-xs text-[#777781] line-clamp-1 mt-0.5">
            {restaurant.tagline}
          </p>

          {/* Clean Unboxed Metadata with · separator */}
          <div className="flex items-center gap-1.5 text-xs text-[#777781] mt-2">
            <MapPin className="w-3.5 h-3.5 text-[#C96884] shrink-0" />
            <span>{restaurant.area}</span>
            <span aria-hidden="true">·</span>
            <span>₹{restaurant.priceForTwo} for two</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#238B68] font-semibold">{restaurant.availableTables || 6} tables left</span>
          </div>
        </div>

        {/* Cancellation snapshot notice */}
        <div className="pt-2.5 border-t border-[#E8E8EC] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-[#777781]">
            <ShieldAlert className="w-3 h-3 text-[#777781]" />
            <span>
              {policy?.type === 'fixed'
                ? `₹${policy.deductionValue} cancel fee`
                : `${policy?.deductionValue || 15}% cancel deduction`}
            </span>
          </div>
          <span className="font-bold text-[#C96884] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Pre-book →
          </span>
        </div>
      </div>
    </div>
  );
};
