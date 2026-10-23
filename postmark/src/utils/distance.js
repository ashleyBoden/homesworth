import { CITY_CENTRES } from "../constants/cities";

export function straightLineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function compareDistances(a, b) {
  return a.distance - b.distance;
}

export function findNearestCity(lat, lng) {
  const withDistances = Object.entries(CITY_CENTRES).map(([name, coords]) => ({
    name,
    distance: straightLineDistance(lat, lng, coords.lat, coords.lng),
  }));

  const sorted = withDistances.sort(compareDistances);
  return sorted[0];
}

export function findNearestAmenity(places) {
  let closest = null;

  if (!places) return null;

  for (const place of places) {
    if (!closest || place.distance < closest.distance) {
      closest = place;
    }
  }

  return closest;
}

export function distanceMiles(distanceKm) {
  const distanceInMiles = distanceKm * 0.621371;

  return Number.parseFloat(distanceInMiles).toFixed(2);
}
