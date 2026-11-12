import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Compass,
  Store,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { RestaurantLocation } from '../../types';
import { GoogleMapCard } from '../common/GoogleMapCard';
import {
  detectBrowserLocation,
  reverseGeocodeCoordinates,
} from '../../services/googleMapsService';
import {
  TUMKUR_COORDINATES,
  isWithinTumkurLaunchArea,
} from '../../utils/geoUtils';
import { KARNATAKA_LOCATIONS } from '../../data/karnatakaLocations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: RestaurantLocation | null;
  onConfirmLocation: (location: RestaurantLocation) => void;
  restaurantName?: string;
}

export const OwnerLocationPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialLocation,
  onConfirmLocation,
  restaurantName = 'Your Restaurant',
}) => {
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(() => ({
    lat: initialLocation?.latitude || TUMKUR_COORDINATES.lat,
    lng: initialLocation?.longitude || TUMKUR_COORDINATES.lng,
  }));

  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedLocation, setVerifiedLocation] = useState<RestaurantLocation | null>(
    initialLocation || null
  );

  // Filter Tumkur localities for quick selection
  const tumkurQuickAreas = KARNATAKA_LOCATIONS.filter(
    (l) => l.district === 'Tumakuru' || l.city.includes('Tumakuru')
  );

  // Reverse geocode whenever coordinates change
  const handleUpdateCoordinates = async (coords: { lat: number; lng: number }) => {
    setCurrentCoords(coords);
    setIsGeocoding(true);
    setErrorMsg(null);
    try {
      const loc = await reverseGeocodeCoordinates(coords.lat, coords.lng);
      setVerifiedLocation(loc);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resolve location address.');
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (isOpen && !verifiedLocation) {
      handleUpdateCoordinates(currentCoords);
    }
  }, [isOpen]);

  // Automatic Location Detection via Browser GPS
  const handleUseCurrentLocation = async () => {
    setIsDetecting(true);
    setErrorMsg(null);
    try {
      const pos = await detectBrowserLocation();
      await handleUpdateCoordinates({
        lat: pos.latitude,
        lng: pos.longitude,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not detect device location.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Select known Tumkur locality
  const handleSelectTumkurArea = async (area: typeof KARNATAKA_LOCATIONS[0]) => {
    if (area.lat && area.lng) {
      await handleUpdateCoordinates({ lat: area.lat, lng: area.lng });
      setSearchQuery('');
    }
  };

  const handleConfirm = () => {
    if (!verifiedLocation) {
      setErrorMsg('Please select and verify a location on the map first.');
      return;
    }
    onConfirmLocation(verifiedLocation);
    onClose();
  };

  if (!isOpen) return null;

  const isTumkur = isWithinTumkurLaunchArea(currentCoords.lat, currentCoords.lng);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#E8E8EC] overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EC] bg-[#F7F7F8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCE8EF] border border-[#F8D3DF] text-[#C96884] flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#34343A]">
                Pinpoint Restaurant Location
              </h2>
              <p className="text-xs text-[#777781]">
                {restaurantName} · Powered by Google Maps Platform
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
          {/* Quick Action: Use My Current Location */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-[#FCE8EF]/40 border border-[#F8D3DF] rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-[#C96884] flex items-center justify-center shrink-0 shadow-2xs">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#34343A]">
                  At the restaurant right now?
                </div>
                <div className="text-[11px] text-[#777781]">
                  Detect GPS location automatically without manual typing.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetecting}
              className="px-4 py-2 bg-[#A8B88A] hover:bg-[#97A779] text-[#25152F] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Compass className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting GPS...' : 'USE MY CURRENT LOCATION'}</span>
            </button>
          </div>

          {/* Search Locality or Landmark */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#5A4B63] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tumkur area, street, or landmark (e.g. Kyatsandra Thatte Idli belt, SIT Campus, Mandipet)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#DDD4E2] focus:border-[#A8B88A] rounded-xl text-xs text-[#25152F] font-bold placeholder:text-[#5A4B63] focus:outline-none transition-colors"
              />
            </div>

            {/* Suggestions dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="max-h-40 overflow-y-auto bg-white border border-[#E8E8EC] rounded-xl shadow-lg p-1 divide-y divide-stone-100 text-xs">
                {tumkurQuickAreas
                  .filter(
                    (a) =>
                      a.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.landmark.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((area, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectTumkurArea(area)}
                      className="w-full text-left px-3 py-2 hover:bg-[#FCE8EF]/40 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-[#34343A] group-hover:text-[#C96884]">
                          {area.area}
                        </div>
                        <div className="text-[10px] text-[#777781]">{area.landmark}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#777781] group-hover:text-[#C96884]" />
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Interactive Google Map with Draggable Pin */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#34343A]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C96884]" />
                Interactive Map — Drag marker to shop entrance
              </span>
              {isGeocoding && (
                <span className="text-[11px] text-[#C96884] animate-pulse">
                  Reverse geocoding address...
                </span>
              )}
            </div>

            <GoogleMapCard
              center={currentCoords}
              zoom={15}
              height="300px"
              draggableMarker={currentCoords}
              onMarkerDragEnd={handleUpdateCoordinates}
              onMapClick={handleUpdateCoordinates}
            />

            <p className="text-[11px] text-[#777781]">
              Tip: Click anywhere on the map or drag the shop icon directly to your stall's entrance or parking area.
            </p>
          </div>

          {/* Launch Region Warning if outside Tumkur */}
          {!isTumkur && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold">Notice:</span> We are currently prioritizing restaurant onboarding in <strong>Tumakuru (Tumkur)</strong> for our launch phase. You can still register; our admin team will review locations outside Tumkur during regional expansion.
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Confirmed Location Breakdown Card */}
          {verifiedLocation && (
            <div className="p-4 bg-[#F7F7F8] border border-[#E8E8EC] rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#C96884] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Google Maps Location</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#34343A]">
                <div>
                  <span className="text-[#777781]">Address: </span>
                  <span className="font-semibold">{verifiedLocation.address}</span>
                </div>
                <div>
                  <span className="text-[#777781]">Locality: </span>
                  <span className="font-semibold">{verifiedLocation.locality}</span>
                </div>
                <div>
                  <span className="text-[#777781]">City / District: </span>
                  <span className="font-semibold">{verifiedLocation.city}, {verifiedLocation.district}</span>
                </div>
                <div>
                  <span className="text-[#777781]">State & PIN: </span>
                  <span className="font-semibold">{verifiedLocation.state} {verifiedLocation.pincode}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E8EC] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E8E8EC] text-xs font-semibold text-[#777781] hover:text-[#34343A] hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!verifiedLocation || isGeocoding}
            className="px-6 py-2.5 rounded-xl bg-[#C96884] hover:bg-[#b25771] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>CONFIRM RESTAURANT LOCATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
