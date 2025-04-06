import { createHash } from 'crypto';

import { countryIndex } from './countryEmojis.ts';
import redis from './redis.ts';

const CACHE_TTL = 86400; // 24 hours in seconds
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API;
const RESULTS_CACHE_TTL = 3600; // 1 hour
const COUNTRY_CACHE_TTL = 604800; // 1 week (country data changes rarely)

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export async function getTravelTimeFromAPI(
  originLatitude: number,
  originLongitude: number,
  destinationLatitude: number,
  destinationLongitude: number,
): Promise<{ travelTimeMinutes: number; distanceKm: number }> {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLatitude},${originLongitude}&destinations=${destinationLatitude},${destinationLongitude}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Error fetching distance:', data);
      return { travelTimeMinutes: 0, distanceKm: 0 };
    }

    const element = data.rows[0].elements[0];
    if (element.status !== 'OK') {
      console.error('Invalid location data:', element);
      return { travelTimeMinutes: 0, distanceKm: 0 };
    }

    return {
      distanceKm: element.distance.value / 1000, // Convert meters to km
      travelTimeMinutes: Math.ceil(element.duration.value / 60), // Convert seconds to minutes
    };
  } catch (error) {
    console.error('Error calling Google Maps API:', error);
    return { travelTimeMinutes: 0, distanceKm: 0 };
  }
}

export async function getCountryFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<{ name: string; abrv: string; flag: string } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Error fetching country data:', data);
      return null;
    }

    const countryComponent = data.results[0]?.address_components?.find(
      (component: { types: string[] }) => component.types.includes('country'),
    );

    if (!countryComponent) {
      console.error('Country not found in address components');
      return null;
    }

    const countryCode = countryComponent.short_name;

    const countryData = Object.values(countryIndex.countryFlagEmoji).find(
      (country) => country.code === countryCode,
    );

    return {
      name: countryComponent.long_name,
      abrv: countryCode,
      flag: countryData ? countryData.emoji : '🏳️',
    };
  } catch (error) {
    console.error('Error calling Google Geocoding API:', error);
    return null;
  }
}

export async function getCachedCountry(
  lat: number,
  lng: number,
): Promise<{ name: string; abrv: string; flag: string } | null> {
  const cacheKey = `country:${lat},${lng}`;
  const cached = await redis.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedCountry(
  lat: number,
  lng: number,
  data: { name: string; abrv: string; flag: string },
): Promise<void> {
  const cacheKey = `country:${lat},${lng}`;
  await redis.setex(cacheKey, COUNTRY_CACHE_TTL, JSON.stringify(data));
}

// caches the distance data
export async function setCachedDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  data: { distanceKm: number; travelTimeMinutes: number },
): Promise<void> {
  const cacheKey = `distance:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
}

export async function getCachedDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ distanceKm: number; travelTimeMinutes: number } | null> {
  const cacheKey = `distance:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
  const cached = await redis.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
}

export function createQueryHash(params: Record<string, string>): string {
  return createHash('sha256').update(JSON.stringify(params)).digest('hex');
}

export function createLocationHash(lat: string, lng: string): string {
  const precision = 3; // ~100m precision
  const latFixed = parseFloat(lat).toFixed(precision);
  const lngFixed = parseFloat(lng).toFixed(precision);
  return createHash('sha256').update(`${latFixed},${lngFixed}`).digest('hex');
}

export async function getCachedResults(userId: string, queryHash: string) {
  const cacheKey = `user_results:${userId}:${queryHash}`;
  const cached = await redis.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheResults(
  userId: string,
  queryHash: string,
  results: unknown[],
) {
  const cacheKey = `user_results:${userId}:${queryHash}`;
  await redis.setex(cacheKey, RESULTS_CACHE_TTL, JSON.stringify(results));
}
