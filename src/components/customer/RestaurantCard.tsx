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
      className="group bg-white rounded-3xl border border-[#DDD4E2] hover:border-[#A8B88A] shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F7F2EA]">
        <img
          src={restaurant.coverImage}
          alt={restaurant.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {restaurant.discountOffer ? (
            <div className="px-2.5 py-1 bg-[#25152F] text-[#E9D8B5] border border-[#25152F] rounded-xl text-xs font-bold shadow-xs">
              {restaurant.discountOffer}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1 px-2.5 py-0.5 bg-white/95 backdrop-blur-xs text-[#25152F] border border-[#DDD4E2] rounded-xl text-xs font-bold shadow-xs">
            <Star className="w-3 h-3 fill-[#B96D79] text-[#B96D79]" />
            <span>{restaurant.averageRating || '4.5'}</span>
          </div>
        </div>

        {/* Facilities Overlay Pill */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1.5 text-[11px] text-white drop-shadow-md overflow-hidden font-bold">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{restaurant.openingTime} – {restaurant.closingTime}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[#25152F] text-base font-display group-hover:text-[#B96D79] transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
          </div>

          <p className="text-xs text-[#5A4B63] line-clamp-1 mt-0.5 font-medium">
            {restaurant.tagline}
          </p>

          {/* Clean Unboxed Metadata with · separator */}
          <div className="flex items-center gap-1.5 text-xs text-[#5A4B63] mt-2 flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-[#B96D79] shrink-0" />
            <span className="font-bold text-[#25152F]">{restaurant.area}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-stone-700">₹{restaurant.priceForTwo} for two</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#238B68] font-bold">{restaurant.availableTables || 6} tables left</span>
          </div>
        </div>

        {/* Cancellation snapshot notice and Get Directions */}
        <div className="pt-2.5 border-t border-[#DDD4E2] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-[#5A4B63] font-medium">
            <ShieldAlert className="w-3 h-3 text-[#B96D79]" />
            <span>
              {policy?.type === 'fixed'
                ? `₹${policy.deductionValue} cancel fee`
                : `${policy?.deductionValue || 15}% cancel deduction`}
            </span>
          </div>
          <span className="font-bold text-[#25152F] group-hover:text-[#B96D79] group-hover:translate-x-0.5 transition-all flex items-center gap-0.5">
            Pre-book Table →
          </span>
        </div>
      </div>
    </div>
  );
};
