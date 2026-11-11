import React, { useState, useMemo } from 'react';
import {
  MapPin,
  X,
  Check,
  Navigation,
  Search,
  Sparkles,
  Compass,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoogleMapCard } from './GoogleMapCard';
import {
  detectBrowserLocation,
  reverseGeocodeCoordinates,
} from '../../services/googleMapsService';
import {
  TUMKUR_COORDINATES,
  calculateDistance,
  formatDistance,
} from '../../utils/geoUtils';
import { KARNATAKA_LOCATIONS } from '../../data/karnatakaLocations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationSelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    currentLocation,
    setCurrentLocation,
    restaurants,
    currentUser,
    updateUserProfile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState<number | 'all'>(10);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);

  // Active coordinates: defaults to Tumakuru
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number }>(() => {
    try {
      const stored = localStorage.getItem('alookhaoge_customer_coords');
      return stored ? JSON.parse(stored) : { lat: TUMKUR_COORDINATES.lat, lng: TUMKUR_COORDINATES.lng };
    } catch {
      return { lat: TUMKUR_COORDINATES.lat, lng: TUMKUR_COORDINATES.lng };
    }
  });

  // Approved active restaurants
  const activeRests = useMemo(
    () => restaurants.filter((r) => r.status === 'ACTIVE' || r.status === 'active'),
    [restaurants]
  );

  // Filter Tumkur localities dynamically
  const tumkurLocations = useMemo(() => {
    return KARNATAKA_LOCATIONS.filter(
      (loc) => loc.district === 'Tumakuru' || loc.city.includes('Tumakuru')
    );
  }, []);

  // Filtered suggestions based on search
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return tumkurLocations.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return KARNATAKA_LOCATIONS.filter(
      (loc) =>
        loc.area.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        loc.landmark.toLowerCase().includes(q) ||
        loc.popularDishTag.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [searchQuery, tumkurLocations]);

  // Handle GPS detection
  const handleUseCurrentLocation = async () => {
    setIsDetecting(true);
    setErrorMsg(null);
    try {
      const pos = await detectBrowserLocation();
      const loc = await reverseGeocodeCoordinates(pos.latitude, pos.longitude);
      setActiveCoords({ lat: pos.latitude, lng: pos.longitude });
      setDetectedAddress(loc.formattedAddress);

      const locationStr = `${loc.locality || loc.city}, Karnataka`;
      setCurrentLocation(locationStr);

      // Persist in localStorage and user profile
      localStorage.setItem('alookhaoge_customer_coords', JSON.stringify({ lat: pos.latitude, lng: pos.longitude }));
      localStorage.setItem('alookhaoge_customer_location', locationStr);
      updateUserProfile({
        preferredLocation: {
          address: loc.formattedAddress,
          locality: loc.locality,
          city: loc.city,
          latitude: pos.latitude,
          longitude: pos.longitude,
          radiusKm: typeof selectedRadius === 'number' ? selectedRadius : undefined,
        },
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not detect your current location.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle selecting a predefined locality
  const handleSelectArea = async (area: typeof KARNATAKA_LOCATIONS[0]) => {
    const coords = {
      lat: area.lat || TUMKUR_COORDINATES.lat,
      lng: area.lng || TUMKUR_COORDINATES.lng,
    };
    setActiveCoords(coords);
    const locationStr = `${area.area}, ${area.city.split(' ')[0]}`;
    setCurrentLocation(locationStr);
    setDetectedAddress(`${area.area}, ${area.landmark}, ${area.city}`);

    localStorage.setItem('alookhaoge_customer_coords', JSON.stringify(coords));
    localStorage.setItem('alookhaoge_customer_location', locationStr);

    updateUserProfile({
      preferredLocation: {
        address: `${area.area}, ${area.city}`,
        locality: area.area,
        city: area.city,
        latitude: coords.lat,
        longitude: coords.lng,
      },
    });
    setSearchQuery('');
  };

  if (!isOpen) return null;

  // Map markers for active restaurants in view
  const mapMarkers = activeRests.map((r) => ({
    id: r.id,
    lat: r.location?.latitude ?? r.lat,
    lng: r.location?.longitude ?? r.lng,
    title: r.name,
    subtitle: `${r.area} · ${formatDistance(
      calculateDistance(
        activeCoords.lat,
        activeCoords.lng,
        r.location?.latitude ?? r.lat,
        r.location?.longitude ?? r.lng
      )
    )}`,
    price: r.priceForTwo,
    rating: r.averageRating,
    image: r.coverImage,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E8E8EC] overflow-hidden flex flex-col my-8 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EC] bg-[#F7F7F8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCE8EF] border border-[#F8D3DF] text-[#C96884] flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#34343A]">
                Discover Food Destinations by Area
              </h2>
              <p className="text-xs text-[#777781]">
                Launch City: Tumakuru (Tumkur) · Powered by Google Maps Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-[#777781] hover:text-[#34343A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Action 1: Use Current Location */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-[#FCE8EF]/40 border border-[#F8D3DF] rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-[#C96884] flex items-center justify-center shrink-0 shadow-2xs">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#34343A]">
                  Use My Current Location
                </div>
                <div className="text-[11px] text-[#777781]">
                  Detect GPS location with explicit browser permission.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetecting}
              className="px-4 py-2.5 bg-[#34343A] hover:bg-[#202024] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Compass className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting GPS...' : 'USE MY CURRENT LOCATION'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Locality or Landmark */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#777781] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any Tumkur locality, market, street, or landmark (e.g. Kyatsandra, SS Puram, Mandipet, SIT)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F8] border border-[#E8E8EC] focus:border-[#E8A0B5] rounded-xl text-xs text-[#34343A] placeholder:text-[#777781] focus:outline-none transition-colors"
              />
            </div>

            {/* Quick Popular Tumkur Hubs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-[#777781] shrink-0 font-medium">Quick Areas:</span>
              {tumkurLocations.slice(0, 6).map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectArea(loc)}
                  className="px-2.5 py-1 rounded-full bg-[#F7F7F8] hover:bg-[#FCE8EF] border border-[#E8E8EC] text-[#34343A] shrink-0 transition-colors cursor-pointer"
                >
                  {loc.area}
                </button>
              ))}
            </div>

            {/* Filtered suggestions list */}
            {searchQuery.trim().length > 0 && (
              <div className="max-h-48 overflow-y-auto bg-white border border-[#E8E8EC] rounded-xl shadow-lg p-1 divide-y divide-stone-100 text-xs">
                {filteredSuggestions.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectArea(loc)}
                    className="w-full text-left px-3 py-2 hover:bg-[#FCE8EF]/40 rounded-lg flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-[#34343A] group-hover:text-[#C96884]">
                        {loc.area}
                      </div>
                      <div className="text-[10px] text-[#777781]">
                        {loc.landmark} · {loc.city}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#C96884] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Discovery Radius Selector */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-semibold text-[#34343A] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#C96884]" />
              Discovery Radius:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[1, 3, 5, 10, 15, 25, 'all'].map((rad) => (
                <button
                  key={rad}
                  type="button"
                  onClick={() => setSelectedRadius(rad as any)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedRadius === rad
                      ? 'bg-[#C96884] text-white shadow-xs'
                      : 'bg-[#F7F7F8] text-[#777781] hover:bg-stone-200'
                  }`}
                >
                  {rad === 'all' ? 'All Areas' : `Within ${rad} km`}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Google Map Preview */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#34343A] flex items-center justify-between">
              <span>Interactive Google Map Preview</span>
              <span className="text-[11px] text-[#777781]">
                {mapMarkers.length} registered food destinations
              </span>
            </div>

            <GoogleMapCard
              center={activeCoords}
              zoom={13}
              height="280px"
              markers={mapMarkers}
              customerLocation={activeCoords}
            />
          </div>

          {/* Selected Status Bar */}
          <div className="p-3 bg-[#F7F7F8] border border-[#E8E8EC] rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C96884]" />
              <div>
                <span className="text-[#777781]">Selected Location: </span>
                <span className="font-bold text-[#34343A]">
                  {detectedAddress || currentLocation}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E8EC] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#C96884] hover:bg-[#b25771] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            CONFIRM & EXPLORE RESTAURANTS
          </button>
        </div>
      </div>
    </div>
  );
};
