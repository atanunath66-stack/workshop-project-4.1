import React from 'react';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  onOpenMap: () => void;
  onOpenLocationModal?: () => void;
}

export const HeroSection: React.FC<Props> = ({ onOpenMap, onOpenLocationModal }) => {
  const { searchQuery, setSearchQuery, currentLocation } = useApp();

  const QUICK_CRAVINGS = [
    'Kyatsandra Thatte Idli',
    'Davanagere Benne Dosa',
    'Tumkur Mirchi Bajji',
    'Maddur Vada',
    'Pani Puri',
    'Kati Roll',
    'Filter Kaapi',
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950/30 via-[#0E1115] to-[#0A0C0E] py-8 sm:py-12 border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          {/* Elegant pill badge with green & pink accents */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-[#E8A0B5]" />
            <span>Support Local Stalls, Cafés &amp; Street Food Legends</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-display leading-tight">
            Discover Hidden Local Food Gems &amp; Pre-Book in <span className="text-[#E8A0B5]">Seconds</span>
          </h1>

          <p className="text-stone-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Reserve tables, pre-order hot dishes before reaching the stall, and enjoy 50% flexible advance payments with transparent cancellation.
          </p>

          {/* Search Bar & Location Input */}
          <div className="pt-2">
            <div className="bg-white p-2 sm:p-2.5 rounded-3xl shadow-sm border border-[#E8E8EC] flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="group flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#34343A] bg-[#F7F7F8] hover:bg-[#FCE8EF]/40 rounded-2xl w-full sm:w-auto shrink-0 border border-[#E8E8EC] hover:border-[#E8A0B5] transition-all text-left shadow-2xs cursor-pointer"
                title="Change discovery location"
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#C96884] transition-transform group-hover:scale-110" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#E8A0B5] rounded-full animate-ping" />
                </div>
                <div className="flex flex-col min-w-0 pr-1 text-left">
                  <span className="text-[10px] text-[#777781] font-medium leading-none">Your Location</span>
                  <span className="truncate max-w-[125px] font-bold text-[#34343A] transition-colors">
                    {currentLocation.split(',')[0]}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#C96884] bg-[#FCE8EF] group-hover:bg-[#F8D3DF] px-2 py-0.5 rounded-lg shrink-0 ml-auto sm:ml-0 transition-colors">
                  Change
                </span>
              </button>

              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#777781] absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you craving today? (e.g. chaat, dosa, roll)"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-transparent placeholder:text-[#777781] text-[#34343A] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={onOpenMap}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#34343A] hover:bg-[#232328] text-white text-xs font-semibold rounded-2xl transition-all whitespace-nowrap shadow-xs cursor-pointer border border-[#E8A0B5]/40"
              >
                Explore on Map
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-[#777781]">
              <span className="font-medium text-[#777781]">Popular cravings:</span>
              {QUICK_CRAVINGS.map((craving) => (
                <button
                  key={craving}
                  onClick={() => setSearchQuery(craving)}
                  className="px-3 py-1 bg-white hover:bg-[#FCE8EF] hover:text-[#C96884] hover:border-[#E8A0B5] border border-[#E8E8EC] rounded-xl text-[#34343A] transition-colors cursor-pointer text-xs"
                >
                  {craving}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
