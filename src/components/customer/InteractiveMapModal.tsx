import React, { useEffect, useRef } from 'react';
import { X, Navigation, Star, MapPin, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { Restaurant } from '../../types';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // STRICT RULE: Only actual approved restaurants
  const approvedRests = restaurants.filter((r) => r.status === 'active');

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const defaultCenter: [number, number] =
      approvedRests.length > 0
        ? [approvedRests[0].lat, approvedRests[0].lng]
        : [12.9716, 77.5946]; // Default city center

    // Initialize Leaflet map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(defaultCenter, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(defaultCenter, 13);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Custom Stall Pin Icon
    const customIcon = L.divIcon({
      className: 'custom-stall-marker',
      html: `
        <div style="background-color: #EA580C; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); color: white; font-size: 14px; font-weight: bold;">
          🥔
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34],
    });

    approvedRests.forEach((rest) => {
      const marker = L.marker([rest.lat, rest.lng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="width: 220px; font-family: sans-serif; padding: 4px;">
          <img src="${rest.coverImage}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;" />
          <div style="font-weight: bold; font-size: 13px; color: #1c1917;">${rest.name}</div>
          <div style="color: #666; font-size: 11px; margin-top: 2px;">${rest.area} · ₹${rest.priceForTwo} for two</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
            <span style="background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">★ ${rest.averageRating}</span>
            <span style="color: #ea580c; font-size: 11px; font-weight: bold;">Pre-book table</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [isOpen, approvedRests]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EC] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FCE8EF] text-[#C96884] flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#34343A] font-display">
                Food Map & Real-time Location Radar
              </h2>
              <p className="text-xs text-[#777781]">
                Displaying actual approved food vendors around {currentLocation}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close map"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Body and Sidebar list */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Map canvas */}
          <div ref={mapContainerRef} className="flex-1 w-full h-full min-h-[300px] z-10" />

          {/* Sidebar */}
          <div className="w-full md:w-80 bg-[#F7F7F8] border-t md:border-t-0 md:border-l border-[#E8E8EC] overflow-y-auto p-4 space-y-3 shrink-0 max-h-[35vh] md:max-h-full">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Approved Locations ({approvedRests.length})
            </div>

            {approvedRests.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-dashed border-stone-300 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-stone-400 mx-auto" />
                <div className="text-xs font-bold text-stone-700">No approved restaurants yet</div>
                <p className="text-[11px] text-[#777781]">
                  As store owners register their food stalls and get approved by admin, their pins will appear here.
                </p>
              </div>
            ) : (
              approvedRests.map((rest) => (
                <div
                  key={rest.id}
                  onClick={() => {
                    onSelectRestaurant(rest);
                    onClose();
                  }}
                  className="p-3 bg-white rounded-2xl border border-[#E8E8EC] hover:border-[#E8A0B5] cursor-pointer transition-all shadow-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-xs font-bold text-stone-900 font-display">{rest.name}</h3>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#238B68] bg-[#238B68]/10 px-1.5 py-0.5 rounded">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {rest.averageRating}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500">
                    <MapPin className="w-3 h-3 text-[#C96884]" />
                    <span>{rest.area}</span>
                    <span>·</span>
                    <span>₹{rest.priceForTwo} for two</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-stone-400">{rest.availableTables} tables free</span>
                    <span className="text-[#C96884] font-bold hover:underline">Pre-book →</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
