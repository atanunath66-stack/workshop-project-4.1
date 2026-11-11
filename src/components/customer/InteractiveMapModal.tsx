import React, { useState, useMemo } from 'react';
import {
  X,
  Navigation,
  Star,
  MapPin,
  Compass,
  UtensilsCrossed,
  Sliders,
  ExternalLink,
  ChevronRight,
  Route as RouteIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Restaurant } from '../../types';
import { GoogleMapCard, MapMarkerItem } from '../common/GoogleMapCard';
import {
  calculateDistance,
  formatDistance,
  calculateEstimatedTravelTime,
  sortRestaurantsWithDistance,
  TUMKUR_COORDINATES,
} from '../../utils/geoUtils';
import { openGoogleMapsDirections } from '../../services/googleMapsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

export const InteractiveMapModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectRestaurant,
}) => {
  const { restaurants, currentLocation } = useApp();
  const [selectedRestId, setSelectedRestId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map_only' | 'list_only'>('split');
  const [sortBy, setSortBy] = useState<'nearest' | 'rating' | 'price_low' | 'popular'>('nearest');

  // Customer center coordinates (stored or default Tumkur)
  const customerCoords = useMemo(() => {
    try {
      const stored = localStorage.getItem('alookhaoge_customer_coords');
      return stored ? JSON.parse(stored) : { lat: TUMKUR_COORDINATES.lat, lng: TUMKUR_COORDINATES.lng };
    } catch {
      return { lat: TUMKUR_COORDINATES.lat, lng: TUMKUR_COORDINATES.lng };
    }
  }, []);

  // Approved active restaurants only
  const activeRestaurants = useMemo(
    () => restaurants.filter((r) => r.status === 'ACTIVE' || r.status === 'active'),
    [restaurants]
  );

  // Calculate distance for all restaurants
  const restaurantItemsWithDistance = useMemo(() => {
    const raw = activeRestaurants.map((r) => {
      const rLat = r.location?.latitude ?? r.lat;
      const rLng = r.location?.longitude ?? r.lng;
      const distanceKm = calculateDistance(customerCoords.lat, customerCoords.lng, rLat, rLng);
      return { restaurant: r, distanceKm };
    });
    return sortRestaurantsWithDistance(raw, sortBy);
  }, [activeRestaurants, customerCoords, sortBy]);

  // Marker items for Google Map
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    return activeRestaurants.map((r) => ({
      id: r.id,
      lat: r.location?.latitude ?? r.lat,
      lng: r.location?.longitude ?? r.lng,
      title: r.name,
      subtitle: `${r.area} · ₹${r.priceForTwo} for two`,
      price: r.priceForTwo,
      rating: r.averageRating,
      image: r.coverImage,
    }));
  }, [activeRestaurants]);

  // Focus coordinates
  const activeFocusCoords = useMemo(() => {
    if (selectedRestId) {
      const found = activeRestaurants.find((r) => r.id === selectedRestId);
      if (found) {
        return {
          lat: found.location?.latitude ?? found.lat,
          lng: found.location?.longitude ?? found.lng,
        };
      }
    }
    return customerCoords;
  }, [selectedRestId, activeRestaurants, customerCoords]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl h-[92vh] bg-white rounded-3xl shadow-2xl border border-[#E8E8EC] overflow-hidden flex flex-col">
        {/* Modal Top Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E8E8EC] bg-[#F7F7F8] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FCE8EF] border border-[#F8D3DF] text-[#C96884] flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm sm:text-base text-[#34343A]">
                Interactive Restaurant Map & Proximity Discovery
              </h2>
              <div className="text-[11px] text-[#777781] flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#C96884]" />
                <span>Base location: {currentLocation}</span>
                <span>·</span>
                <span className="font-semibold text-[#34343A]">{activeRestaurants.length} approved eateries</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="hidden sm:flex items-center bg-[#F7F7F8] border border-[#E8E8EC] p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'split' ? 'bg-white text-[#34343A] shadow-xs' : 'text-[#777781]'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode('map_only')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'map_only' ? 'bg-white text-[#34343A] shadow-xs' : 'text-[#777781]'
                }`}
              >
                Map Only
              </button>
              <button
                onClick={() => setViewMode('list_only')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list_only' ? 'bg-white text-[#34343A] shadow-xs' : 'text-[#777781]'
                }`}
              >
                List Only
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-[#777781] hover:text-[#34343A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Container */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Map Area */}
          {(viewMode === 'split' || viewMode === 'map_only') && (
            <div className={`relative ${viewMode === 'split' ? 'w-full md:w-3/5 h-1/2 md:h-full' : 'w-full h-full'}`}>
              <GoogleMapCard
                center={activeFocusCoords}
                zoom={14}
                height="100%"
                markers={mapMarkers}
                selectedMarkerId={selectedRestId}
                onSelectMarker={(m) => setSelectedRestId(m.id)}
                customerLocation={customerCoords}
              />
            </div>
          )}

          {/* Restaurant List Area */}
          {(viewMode === 'split' || viewMode === 'list_only') && (
            <div
              className={`${
                viewMode === 'split' ? 'w-full md:w-2/5 h-1/2 md:h-full border-t md:border-t-0 md:border-l border-[#E8E8EC]' : 'w-full h-full'
              } flex flex-col bg-[#F7F7F8] min-h-0`}
            >
              {/* Sort header */}
              <div className="p-3 border-b border-[#E8E8EC] bg-white flex items-center justify-between text-xs shrink-0">
                <span className="font-semibold text-[#34343A] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#C96884]" />
                  Sort By:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1 bg-[#F7F7F8] border border-[#E8E8EC] rounded-lg text-xs font-semibold text-[#34343A] focus:outline-none"
                >
                  <option value="nearest">Nearest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
                  <option value="price_low">Lowest Price</option>
                </select>
              </div>

              {/* Scrollable Restaurant Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {restaurantItemsWithDistance.length === 0 ? (
                  <div className="p-8 text-center text-[#777781] space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E8EC] text-stone-400 flex items-center justify-center mx-auto text-xl shadow-xs">
                      🍽️
                    </div>
                    <div className="font-bold text-sm text-[#34343A]">No restaurants in view</div>
                    <p className="text-xs max-w-xs mx-auto">
                      Newly approved food stalls in Tumakuru will appear here automatically.
                    </p>
                  </div>
                ) : (
                  restaurantItemsWithDistance.map(({ restaurant, distanceKm }) => {
                    const isSelected = selectedRestId === restaurant.id;
                    const travelTime = calculateEstimatedTravelTime(distanceKm, 'driving');

                    return (
                      <div
                        key={restaurant.id}
                        onClick={() => setSelectedRestId(restaurant.id)}
                        className={`p-3.5 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
                          isSelected
                            ? 'border-[#C96884] ring-2 ring-[#C96884]/20 shadow-sm'
                            : 'border-[#E8E8EC] hover:border-[#E8A0B5]'
                        }`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={restaurant.coverImage}
                            alt={restaurant.name}
                            className="w-20 h-20 rounded-xl object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="font-bold text-xs sm:text-sm text-[#34343A] truncate">
                                {restaurant.name}
                              </h3>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
                                <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                                {restaurant.averageRating.toFixed(1)}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#777781] mt-0.5 truncate">
                              {restaurant.area} · ₹{restaurant.priceForTwo} for two
                            </p>

                            <div className="flex items-center gap-2 mt-2 text-[10px] text-[#34343A] font-semibold">
                              <span className="inline-flex items-center gap-1 text-[#C96884] bg-[#FCE8EF] px-2 py-0.5 rounded-md">
                                <Navigation className="w-2.5 h-2.5" />
                                {formatDistance(distanceKm)}
                              </span>
                              <span className="text-[#777781] font-normal">
                                {travelTime.text} drive
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-stone-100 text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openGoogleMapsDirections(
                                restaurant.location?.latitude ?? restaurant.lat,
                                restaurant.location?.longitude ?? restaurant.lng,
                                restaurant.name,
                                customerCoords.lat,
                                customerCoords.lng
                              );
                            }}
                            className="flex-1 py-1.5 px-2 bg-[#F7F7F8] hover:bg-stone-200 text-[#34343A] rounded-xl font-semibold flex items-center justify-center gap-1 text-[11px] transition-colors cursor-pointer"
                          >
                            <RouteIcon className="w-3 h-3 text-[#C96884]" />
                            <span>GET DIRECTIONS</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRestaurant(restaurant);
                              onClose();
                            }}
                            className="flex-1 py-1.5 px-2 bg-[#C96884] hover:bg-[#b25771] text-white rounded-xl font-bold flex items-center justify-center gap-1 text-[11px] transition-colors cursor-pointer shadow-2xs"
                          >
                            <span>Pre-Book Table</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
