import { KAABA_COORDS } from "./types";

/**
 * Haversine distance antara dua koordinat, hasil dalam km.
 */
export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format jarak km jadi string ramah baca.
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Bearing (arah dari utara, searah jarum jam) dari titik user ke Ka'bah.
 * Hasil dalam derajat 0-360.
 */
export function qiblaBearing(lat: number, lng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const latU = toRad(lat);
  const lngU = toRad(lng);
  const latK = toRad(KAABA_COORDS.lat);
  const dLng = toRad(KAABA_COORDS.lng - lng);

  const y = Math.sin(dLng) * Math.cos(latK);
  const x =
    Math.cos(latU) * Math.sin(latK) -
    Math.sin(latU) * Math.cos(latK) * Math.cos(dLng);
  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Jarak lurus (haversine) dari titik user ke Ka'bah, dalam km.
 */
export function distanceToKaaba(lat: number, lng: number): number {
  return haversine(lat, lng, KAABA_COORDS.lat, KAABA_COORDS.lng);
}
