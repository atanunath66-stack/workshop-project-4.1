/**
 * Geospatial Utilities for ZAikya Hyperlocal Platform
 * Launch City: Tumakuru (Tumkur), Karnataka, India
 */

import { Restaurant } from '../types';

export const TUMKUR_COORDINATES = {
  lat: 13.3409,
  lng: 77.101,
  city: 'Tumakuru',
  district: 'Tumakuru',
  state: 'Karnataka',
  country: 'India',
};

// Geographic bounding box for Tumakuru and immediate food corridors (NH-48, Kyatsandra, SIT, Mandipet)
export const TUMKUR_BOUNDS = {
  north: 13.48,
  south: 13.22,
  east: 77.28,
  west: 77.01,
};

/**
 * Calculates great-circle distance between two coordinates using the Haversine formula (km)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  // Same coordinates
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Formats distance for clean user display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm === undefined || isNaN(distanceKm)) return '--';
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Calculates estimated travel time based on mode (driving/walking)
 */
export function calculateEstimatedTravelTime(
  distanceKm: number,
  mode: 'driving' | 'walking' | 'two_wheeler' = 'driving'
): { durationMinutes: number; text: string } {
  if (distanceKm <= 0) {
    return { durationMinutes: 1, text: '< 2 mins' };
  }

  // Average urban speeds in Indian tier-2 towns (Tumkur traffic patterns)
  let speedKmH = 25; // Driving
  if (mode === 'walking') speedKmH = 4.5;
  if (mode === 'two_wheeler') speedKmH = 32;

  const hours = distanceKm / speedKmH;
  const minutes = Math.max(2, Math.round(hours * 60));

  if (minutes < 60) {
    return { durationMinutes: minutes, text: `~${minutes} mins` };
  }
  const hrs = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return {
    durationMinutes: minutes,
    text: remainingMins > 0 ? `~${hrs} hr ${remainingMins} mins` : `~${hrs} hr`,
  };
}

/**
 * Filters restaurants within a given radial distance
 */
export function filterRestaurantsByRadius(
  restaurants: Restaurant[],
  centerLat: number,
  centerLng: number,
  radiusKm: number | 'all'
): { restaurant: Restaurant; distanceKm: number }[] {
  const withDistance = restaurants.map((r) => {
    const restLat = r.location?.latitude ?? r.lat;
    const restLng = r.location?.longitude ?? r.lng;
    const distanceKm = calculateDistance(centerLat, centerLng, restLat, restLng);
    return { restaurant: r, distanceKm };
  });

  if (radiusKm === 'all' || !radiusKm) {
    return withDistance;
  }

  return withDistance.filter((item) => item.distanceKm <= radiusKm);
}

/**
 * Sorts restaurants by proximity or other criteria
 */
export function sortRestaurantsWithDistance(
  items: { restaurant: Restaurant; distanceKm: number }[],
  sortBy: 'nearest' | 'rating' | 'popular' | 'price_low' | 'discount'
): { restaurant: Restaurant; distanceKm: number }[] {
  const cloned = [...items];

  switch (sortBy) {
    case 'nearest':
      return cloned.sort((a, b) => a.distanceKm - b.distanceKm);
    case 'rating':
      return cloned.sort(
        (a, b) =>
          b.restaurant.averageRating - a.restaurant.averageRating ||
          a.distanceKm - b.distanceKm
      );
    case 'popular':
      return cloned.sort(
        (a, b) =>
          b.restaurant.totalReviews - a.restaurant.totalReviews ||
          a.distanceKm - b.distanceKm
      );
    case 'price_low':
      return cloned.sort(
        (a, b) =>
          a.restaurant.priceForTwo - b.restaurant.priceForTwo ||
          a.distanceKm - b.distanceKm
      );
    case 'discount':
      return cloned.sort((a, b) => {
        const hasA = a.restaurant.discountOffer ? 1 : 0;
        const hasB = b.restaurant.discountOffer ? 1 : 0;
        return hasB - hasA || a.distanceKm - b.distanceKm;
      });
    default:
      return cloned;
  }
}

/**
 * Checks if coordinates fall within Tumakuru launch area
 */
export function isWithinTumkurLaunchArea(lat: number, lng: number): boolean {
  return (
    lat >= TUMKUR_BOUNDS.south &&
    lat <= TUMKUR_BOUNDS.north &&
    lng >= TUMKUR_BOUNDS.west &&
    lng <= TUMKUR_BOUNDS.east
  );
}
