import {Coordinates, Qibla} from 'adhan';
import {Coords} from '../salat/times';

const KAABA: Coords = {latitude: 21.4225, longitude: 39.8262};

// Bearing from true north, 0-360, towards the Kaaba.
export function qiblaBearing(c: Coords): number {
  return Qibla(new Coordinates(c.latitude, c.longitude));
}

// Great-circle distance to the Kaaba in km (haversine).
export function kaabaDistanceKm(c: Coords): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(KAABA.latitude - c.latitude);
  const dLon = rad(KAABA.longitude - c.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(c.latitude)) * Math.cos(rad(KAABA.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Clockwise angle from the phone's top edge to magnetic north (phone held flat), 0-360.
export function headingFromMag(x: number, y: number): number {
  return (((Math.atan2(-x, y) * 180) / Math.PI) + 360) % 360;
}
