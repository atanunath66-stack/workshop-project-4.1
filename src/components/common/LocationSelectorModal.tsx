import React, { useState, useMemo } from 'react';
import { MapPin, X, Check, Navigation, Search, Sparkles, Compass, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  KARNATAKA_LOCATIONS,
  PRIMARY_REGIONS,
  LocationItem,
} from '../../data/karnatakaLocations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationSelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentLocation, setCurrentLocation } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccessMessage, setGpsSuccessMessage] = useState<string | null>(null);

  // Filter locations across Karnataka and other regions
  const filteredLocations = useMemo(() => {
    return KARNATAKA_LOCATIONS.filter((loc) => {
      // Region filter
      if (selectedRegion !== 'All') {
        if (selectedRegion === 'Tumakuru (Tumkur)') {
          if (!loc.city.includes('Tumakuru') && loc.district !== 'Tumakuru') return false;
        } else if (selectedRegion === 'Bengaluru') {
          if (!loc.city.includes('Bengaluru') && !loc.district.includes('Bengaluru')) return false;
        } else if (selectedRegion === 'Mysuru') {
          if (!loc.city.includes('Mysuru') && loc.district !== 'Mysuru') return false;
        } else if (selectedRegion === 'Mangaluru & Udupi') {
          if (
            !loc.city.includes('Mangaluru') &&
            !loc.city.includes('Udupi') &&
            loc.district !== 'Dakshina Kannada' &&
            loc.district !== 'Udupi'
          )
            return false;
        } else if (selectedRegion === 'Hubballi-Dharwad') {
          if (!loc.city.includes('Hubballi') && !loc.city.includes('Dharwad') && loc.district !== 'Dharwad')
            return false;
        } else if (selectedRegion === 'Davanagere') {
          if (!loc.city.includes('Davanagere') && loc.district !== 'Davanagere') return false;
        } else if (selectedRegion === 'Belagavi') {
          if (!loc.city.includes('Belagavi') && loc.district !== 'Belagavi') return false;
        } else if (selectedRegion === 'Shivamogga') {
          if (!loc.city.includes('Shivamogga') && loc.district !== 'Shivamogga') return false;
        } else if (selectedRegion === 'Coastal & Malnad') {
          const malnadDistricts = [
            'Chikkamagaluru',
            'Kodagu',
            'Hassan',
            'Uttara Kannada',
            'Shivamogga',
            'Udupi',
            'Dakshina Kannada',
          ];
          if (!malnadDistricts.includes(loc.district)) return false;
        } else if (selectedRegion === 'North Karnataka') {
          const northDistricts = [
            'Vijayapura',
            'Kalaburagi',
            'Ballari',
            'Bagalkote',
            'Bidar',
            'Raichur',
            'Vijayanagara',
            'Koppal',
            'Gadag',
            'Haveri',
            'Yadgir',
            'Belagavi',
            'Dharwad',
          ];
          if (!northDistricts.includes(loc.district)) return false;
        } else if (selectedRegion === 'Other Cities') {
          if (loc.state !== 'Other') return false;
        }
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchArea = loc.area.toLowerCase().includes(q);
        const matchCity = loc.city.toLowerCase().includes(q);
        const matchDistrict = loc.district.toLowerCase().includes(q);
        const matchLandmark = loc.landmark.toLowerCase().includes(q);
        const matchTag = loc.popularDishTag.toLowerCase().includes(q);
        const matchHotspots = loc.hotspots.toLowerCase().includes(q);

        // Friendly synonyms for Tumakuru / Tumkur / Tumakur
        const isTumkurQuery = q.includes('tumkur') || q.includes('tumakur') || q.includes('tumakuru');
        const matchTumkur = isTumkurQuery && (loc.city.includes('Tumakuru') || loc.district === 'Tumakuru');

        return matchArea || matchCity || matchDistrict || matchLandmark || matchTag || matchHotspots || matchTumkur;
      }
      return true;
    });
  }, [selectedRegion, searchQuery]);

  if (!isOpen) return null;

  const handleSelectLocation = (label: string) => {
    setCurrentLocation(label);
    onClose();
  };

  const handleDetectGPS = () => {
    setIsDetectingGps(true);
    setGpsSuccessMessage(null);

    // Simulate GPS high accuracy acquisition
    setTimeout(() => {
      setIsDetectingGps(false);
      const detected = 'Kyatsandra, Tumakuru (Tumkur)';
      setCurrentLocation(detected);
      setGpsSuccessMessage('GPS Acquired: High precision fix on Kyatsandra, Tumakuru');
      setTimeout(() => {
        onClose();
      }, 700);
    }, 600);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FCE8EF] text-[#C96884] flex items-center justify-center font-bold shadow-2xs">
                <Compass className="w-4 h-4 text-[#C96884]" />
              </div>
              <h2 className="text-lg font-bold font-display text-stone-900">
                Choose Karnataka Discovery Location
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Browse small restaurants, food stalls & street legends across every district of Karnataka
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close location selector"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Auto-detect Button */}
        <div className="px-6 pt-3">
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isDetectingGps}
            className="w-full p-3 bg-gradient-to-r from-[#FCE8EF]/40 via-white to-[#FCE8EF]/40 border border-[#E8A0B5]/50 hover:border-[#E8A0B5] rounded-2xl flex items-center justify-between text-xs font-semibold text-stone-800 transition-all shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#34343A] text-white flex items-center justify-center shadow-xs">
                <Navigation
                  className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}
                />
              </div>
              <div className="text-left">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>{isDetectingGps ? 'Detecting Nearest Karnataka Food Hub...' : 'Use Current GPS Location'}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8A0B5] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C96884]" />
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 font-normal">
                  Auto-detect neighborhood for live pre-bookings & ETA
                </div>
              </div>
            </div>

            <span className="text-[11px] font-bold text-[#C96884] px-2.5 py-1 bg-white rounded-xl border border-[#E8A0B5]/40 shrink-0">
              {isDetectingGps ? 'Locating...' : 'Locate Me'}
            </span>
          </button>

          {gpsSuccessMessage && (
            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 font-medium animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{gpsSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Tumakuru (Tumkur) Quick Hotspot Spotlight Banner */}
        <div className="px-6 pt-3">
          <div className="p-2.5 bg-gradient-to-r from-[#FCE8EF]/50 via-stone-50 to-[#FCE8EF]/50 border border-[#E8A0B5]/40 rounded-2xl">
            <div className="flex items-center justify-between gap-2 pb-1.5">
              <div className="flex items-center gap-1.5 text-stone-900 font-bold text-xs">
                <Flame className="w-3.5 h-3.5 text-[#C96884]" />
                <span>Tumakuru (Tumkur) Food Hubs</span>
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-[#34343A] text-white rounded">
                  Featured
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRegion('Tumakuru (Tumkur)');
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-[#C96884] hover:text-[#9e435d] hover:underline cursor-pointer"
              >
                View all Tumakuru ({KARNATAKA_LOCATIONS.filter((l) => l.district === 'Tumakuru').length}) →
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { name: 'Kyatsandra Thatte Idli', val: 'Kyatsandra, Tumakuru (Tumkur)' },
                { name: 'MG Road / Town Hall', val: 'MG Road & Town Hall, Tumakuru (Tumkur)' },
                { name: 'Siddaganga Math', val: 'Siddaganga Math Road, Tumakuru (Tumkur)' },
                { name: 'Mandipet & Gubbi Gate', val: 'Mandipet & Gubbi Gate, Tumakuru (Tumkur)' },
                { name: 'Tiptur (Copra Capital)', val: 'Tiptur, Tumakuru (Tumkur)' },
                { name: 'Kunigal', val: 'Kunigal, Tumakuru (Tumkur)' },
              ].map((spot) => (
                <button
                  key={spot.name}
                  type="button"
                  onClick={() => handleSelectLocation(spot.val)}
                  className="px-2 py-1 bg-white hover:bg-[#FCE8EF]/40 hover:border-[#E8A0B5] border border-stone-200 rounded-lg text-[11px] font-medium text-stone-700 transition-colors cursor-pointer"
                >
                  {spot.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search input */}
        <div className="px-6 pt-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tumakuru, Kyatsandra, Bengaluru, Davanagere, district, dish..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#E8A0B5] focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Region Filter Tabs */}
        <div className="px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-stone-100">
          {PRIMARY_REGIONS.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => setSelectedRegion(region)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === region
                  ? 'bg-[#34343A] text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600'
              }`}
            >
              {region === 'Tumakuru (Tumkur)' ? '⭐ Tumakuru' : region}
            </button>
          ))}
        </div>

        {/* Locality list */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((loc) => {
              const label = `${loc.area}, ${loc.city}`;
              const isSelected = currentLocation === label;
              const isTumakuru = loc.district === 'Tumakuru';

              return (
                <button
                  key={`${loc.area}-${loc.city}`}
                  type="button"
                  onClick={() => handleSelectLocation(label)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#E8A0B5] bg-[#FCE8EF]/60 text-stone-900 font-medium shadow-xs ring-1 ring-[#E8A0B5]/60'
                      : isTumakuru
                      ? 'border-[#E8A0B5]/40 bg-[#FCE8EF]/20 hover:border-[#E8A0B5] hover:bg-[#FCE8EF]/40 text-stone-800'
                      : 'border-stone-200/80 hover:border-[#E8A0B5]/60 hover:bg-stone-50/80 text-stone-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                        isSelected
                          ? 'bg-[#34343A] text-white'
                          : isTumakuru
                          ? 'bg-[#FCE8EF] text-[#C96884] font-bold border border-[#E8A0B5]/40'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-stone-900">{loc.area}</span>
                        <span className="text-[11px] font-medium text-stone-500">· {loc.city}</span>
                        {isTumakuru && (
                          <span className="px-1.5 py-0.2 bg-[#FCE8EF] text-[#C96884] text-[10px] font-bold rounded border border-[#E8A0B5]/40">
                            Tumakuru District
                          </span>
                        )}
                        {loc.state === 'Karnataka' && !isTumakuru && (
                          <span className="px-1.5 py-0.2 bg-stone-100 text-stone-600 text-[9px] font-semibold rounded">
                            {loc.district}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-stone-500 line-clamp-1">{loc.landmark}</div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="px-2 py-0.5 bg-[#FCE8EF] text-[#34343A] text-[10px] font-bold rounded-md">
                          {loc.popularDishTag}
                        </span>
                        <span className="text-[10px] text-stone-400">{loc.hotspots}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-[#34343A] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-stone-200 text-transparent" />
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-stone-400 space-y-2">
              <p>No Karnataka localities found matching "{searchQuery}".</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('All');
                }}
                className="text-[#C96884] font-semibold hover:underline cursor-pointer"
              >
                Clear search filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C96884]" />
            <span>All Karnataka districts & Tumakuru food hubs covered</span>
          </div>
          <span className="font-semibold text-stone-700 font-mono text-[11px]">
            {filteredLocations.length} locations
          </span>
        </div>
      </div>
    </div>
  );
};

