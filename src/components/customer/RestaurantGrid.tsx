import React, { useState } from 'react';
import { SlidersHorizontal, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RestaurantCard } from './RestaurantCard';
import { Restaurant } from '../../types';

interface Props {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenLocationModal?: () => void;
}

export const RestaurantGrid: React.FC<Props> = ({
  onSelectRestaurant,
  onOpenLocationModal,
}) => {
  const { restaurants, activeCategory, setActiveCategory, searchQuery, currentLocation } = useApp();
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'popular'>('popular');
  const [onlyVeg, setOnlyVeg] = useState(false);
  const [onlyOffers, setOnlyOffers] = useState(false);

  // Support both uppercase 'ACTIVE' and lowercase 'active'
  const approvedRestaurants = restaurants.filter(
    (r) => r.status === 'ACTIVE' || r.status === 'active'
  );

  const filtered = approvedRestaurants.filter((rest) => {
    // Search query matches restaurant name, area, or menu item
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (rest.name || '').toLowerCase().includes(q);
      const matchArea = (rest.area || '').toLowerCase().includes(q);
      const matchTag = (rest.tagline || '').toLowerCase().includes(q);
      const matchMenu = (rest.menu || []).some((m) => (m.name || '').toLowerCase().includes(q));
      if (!matchName && !matchArea && !matchTag && !matchMenu) return false;
    }

    // Category filter
    if (activeCategory !== 'All') {
      const matchCat = (rest.categories || []).some((c) => c === activeCategory);
      const matchMenuCat = (rest.menu || []).some((m) => m.category === activeCategory);
      if (!matchCat && !matchMenuCat) return false;
    }

    // Veg filter
    if (onlyVeg) {
      const hasVeg = (rest.menu || []).some((m) => m.isVeg);
      if (!hasVeg) return false;
    }

    // Offers filter
    if (onlyOffers && !rest.discountOffer) {
      return false;
    }

    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    if (sortBy === 'price') return (a.priceForTwo || 0) - (b.priceForTwo || 0);
    return (b.totalReviews || 0) - (a.totalReviews || 0);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Filters & Sorting Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E8EC]">
        <div>
          <h2 className="text-xl font-bold font-display text-[#34343A] flex items-center gap-2">
            <span>Local Gems in {currentLocation.split(',')[0]}</span>
            <span className="text-xs font-mono font-medium text-[#777781]">
              ({sorted.length} {sorted.length === 1 ? 'place' : 'places'})
            </span>
          </h2>
          <p className="text-xs text-[#777781]">
            Real registered neighborhood stalls, cafes and eateries
          </p>
        </div>

        {approvedRestaurants.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Veg toggle */}
            <button
              onClick={() => setOnlyVeg(!onlyVeg)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                onlyVeg
                  ? 'bg-emerald-50 border-emerald-300 text-[#238B68]'
                  : 'bg-white border-[#E8E8EC] text-[#777781] hover:bg-[#F7F7F8]'
              }`}
            >
              Pure Veg Only
            </button>

            {/* Quick Offers toggle */}
            <button
              onClick={() => setOnlyOffers(!onlyOffers)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                onlyOffers
                  ? 'bg-[#FCE8EF] border-[#F8D3DF] text-[#C96884]'
                  : 'bg-white border-[#E8E8EC] text-[#777781] hover:bg-[#F7F7F8]'
              }`}
            >
              With Discounts
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-[#E8E8EC] rounded-2xl px-3 py-1.5 text-xs text-[#34343A]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#777781]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent focus:outline-none font-medium cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="price">Budget-Friendly (₹)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* When NO approved restaurants exist */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-[#E8E8EC] max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#FCE8EF] text-[#C96884] flex items-center justify-center mx-auto text-2xl font-display border border-[#F8D3DF]">
            🍽️
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#34343A] font-display text-lg">
              No restaurants in your area yet.
            </h3>
            <p className="text-xs text-[#777781] max-w-md mx-auto leading-relaxed">
              Be the first to discover amazing local food. Newly approved local food stalls in Karnataka will appear here automatically!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onOpenLocationModal && (
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#34343A] hover:bg-[#232328] text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border border-[#E8A0B5]/40"
              >
                <MapPin className="w-3.5 h-3.5 text-[#E8A0B5]" />
                <span>Explore Another Location</span>
              </button>
            )}

            {activeCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setActiveCategory('All')}
                className="w-full sm:w-auto px-4 py-2.5 border border-[#E8E8EC] hover:bg-[#F7F7F8] text-[#34343A] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C96884]" />
                <span>Browse All Categories</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((rest) => (
            <RestaurantCard
              key={rest.id}
              restaurant={rest}
              onClick={() => onSelectRestaurant(rest)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
