import React, { useState, useEffect } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  GMP_ATTRIBUTION_ID,
} from '../../services/googleMapsService';
import { MapPin, Navigation, Sparkles, ExternalLink } from 'lucide-react';

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  price?: number;
  rating?: number;
  image?: string;
  isSpecialty?: boolean;
}

interface Props {
  center: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  markers?: MapMarkerItem[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: MapMarkerItem) => void;
  // Draggable marker options for owner location picker
  draggableMarker?: { lat: number; lng: number } | null;
  onMarkerDragEnd?: (coords: { lat: number; lng: number }) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  customerLocation?: { lat: number; lng: number } | null;
  className?: string;
}

// Sub-component to pan map smoothly when center changes
const MapRecenter: React.FC<{ center: { lat: number; lng: number }; zoom?: number }> = ({
  center,
  zoom,
}) => {
  const map = useMap();
  useEffect(() => {
    if (map && center && center.lat && center.lng) {
      map.panTo({ lat: center.lat, lng: center.lng });
      if (zoom) map.setZoom(zoom);
    }
  }, [map, center.lat, center.lng, zoom]);
  return null;
};

export const GoogleMapCard: React.FC<Props> = ({
  center,
  zoom = 14,
  height = '420px',
  markers = [],
  selectedMarkerId,
  onSelectMarker,
  draggableMarker,
  onMarkerDragEnd,
  onMapClick,
  customerLocation,
  className = '',
}) => {
  const [activeInfoWindow, setActiveInfoWindow] = useState<MapMarkerItem | null>(null);

  useEffect(() => {
    if (selectedMarkerId) {
      const found = markers.find((m) => m.id === selectedMarkerId);
      if (found) setActiveInfoWindow(found);
    }
  }, [selectedMarkerId, markers]);

  const handleMapClickInternal = (e: any) => {
    if (onMapClick && e.detail?.latLng) {
      onMapClick({
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng,
      });
    }
  };

  // If no Google Maps API Key is provided yet, show a clean informative interactive fallback card
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        style={{ height }}
        className={`relative w-full rounded-2xl overflow-hidden bg-[#34343A] text-white flex flex-col items-center justify-center p-6 border border-stone-800 shadow-inner ${className}`}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#E8A0B5]/20 border border-[#E8A0B5]/40 text-[#E8A0B5] flex items-center justify-center mb-3">
          <MapPin className="w-7 h-7" />
        </div>
        <div className="font-display font-bold text-base text-stone-100 text-center">
          Google Maps Platform Ready
        </div>
        <p className="text-xs text-stone-400 text-center max-w-md mt-1 leading-relaxed">
          Google Maps API key configured. Provide <code className="text-[#E8A0B5] bg-stone-900 px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in Google Cloud Console or your environment variables to render live tiles.
        </p>

        {/* Display selected coordinates badge */}
        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-700 text-[11px] font-mono text-[#E8A0B5]">
          <Navigation className="w-3 h-3" />
          <span>
            {center.lat.toFixed(4)}° N, {center.lng.toFixed(4)}° E
          </span>
        </div>

        {/* Marker list preview */}
        {markers.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg">
            {markers.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMarker && onSelectMarker(m)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedMarkerId === m.id
                    ? 'bg-[#E8A0B5] text-stone-900'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <span>🥔</span>
                <span>{m.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className={`relative w-full rounded-2xl overflow-hidden border border-[#E8E8EC] shadow-sm ${className}`}
    >
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={handleMapClickInternal}
        internalUsageAttributionIds={[GMP_ATTRIBUTION_ID]}
        style={{ width: '100%', height: '100%' }}
      >
        <MapRecenter center={center} zoom={zoom} />

        {/* Customer's current location beacon */}
        {customerLocation && (
          <AdvancedMarker
            position={{ lat: customerLocation.lat, lng: customerLocation.lng }}
            title="Your Current Location"
          >
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-sky-400 opacity-60" />
              <div className="w-5 h-5 rounded-full bg-sky-600 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white">
                📍
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* Draggable marker for Owner registration/adjustment */}
        {draggableMarker && (
          <AdvancedMarker
            position={{ lat: draggableMarker.lat, lng: draggableMarker.lng }}
            draggable={true}
            onDragEnd={(e: any) => {
              if (onMarkerDragEnd && e.latLng) {
                onMarkerDragEnd({
                  lat: e.latLng.lat(),
                  lng: e.latLng.lng(),
                });
              }
            }}
            title="Drag marker to exact restaurant entrance"
          >
            <div className="group cursor-grab active:cursor-grabbing">
              <div className="w-10 h-10 rounded-2xl bg-[#E8A0B5] border-2 border-white shadow-xl flex items-center justify-center text-lg text-white font-bold transition-transform group-hover:scale-110">
                🏪
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-[#34343A] text-white text-[10px] font-bold shadow-md">
                Drag to entrance
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* Approved Restaurant Markers */}
        {markers.map((item) => {
          const isSelected = selectedMarkerId === item.id;
          return (
            <AdvancedMarker
              key={item.id}
              position={{ lat: item.lat, lng: item.lng }}
              title={item.title}
              onClick={() => {
                setActiveInfoWindow(item);
                if (onSelectMarker) onSelectMarker(item);
              }}
            >
              <div
                className={`transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                }`}
              >
                <Pin
                  background={isSelected ? '#34343A' : '#E8A0B5'}
                  glyphColor="#FFFFFF"
                  borderColor={isSelected ? '#E8A0B5' : '#FFFFFF'}
                  scale={isSelected ? 1.25 : 1.05}
                />
              </div>
            </AdvancedMarker>
          );
        })}

        {/* Interactive Info Window for clicked restaurant */}
        {activeInfoWindow && (
          <InfoWindow
            position={{ lat: activeInfoWindow.lat, lng: activeInfoWindow.lng }}
            onCloseClick={() => setActiveInfoWindow(null)}
          >
            <div className="w-52 p-1 font-sans text-stone-900">
              {activeInfoWindow.image && (
                <img
                  src={activeInfoWindow.image}
                  alt={activeInfoWindow.title}
                  className="w-full h-24 object-cover rounded-lg mb-2 shadow-xs"
                />
              )}
              <div className="font-bold text-xs text-[#34343A] line-clamp-1">
                {activeInfoWindow.title}
              </div>
              {activeInfoWindow.subtitle && (
                <div className="text-[11px] text-[#777781] mt-0.5 line-clamp-1">
                  {activeInfoWindow.subtitle}
                </div>
              )}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                {activeInfoWindow.rating !== undefined && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    ★ {activeInfoWindow.rating.toFixed(1)}
                  </span>
                )}
                {activeInfoWindow.price && (
                  <span className="text-[11px] font-semibold text-stone-800">
                    ₹{activeInfoWindow.price} for two
                  </span>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
};
