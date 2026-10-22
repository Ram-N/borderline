import type { Difficulty } from '../../types/landmark/game';
import type { ConfidenceLevel } from '../../types/landmark/game';
import type { GeoBounds } from './coordTransform';

const EARTH_RADIUS_KM = 6371;

/** Haversine formula — distance in km between two lat/lon points. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Corner-to-corner distance of a map's bounds, in km. */
export function mapDiagonalKm(bounds: GeoBounds): number {
  return haversineKm(bounds.minLat, bounds.minLon, bounds.maxLat, bounds.maxLon);
}

/**
 * Confidence is a bet: "my pin is within this circle".
 * radiusFraction: circle radius as a fraction of the map diagonal
 * maxPoints:      points for a dead-centre pin (half of this at the circle edge)
 */
export const CONFIDENCE_TIERS: Record<ConfidenceLevel, { label: string; radiusFraction: number; maxPoints: number }> = {
  low:    { label: 'Guessing',    radiusFraction: 0.35, maxPoints: 25  },
  medium: { label: 'Fairly sure', radiusFraction: 0.15, maxPoints: 60  },
  high:   { label: 'Certain',     radiusFraction: 0.05, maxPoints: 100 },
};

/** Difficulty scales every circle: easier levels get bigger circles. */
const DIFFICULTY_RADIUS_SCALE: Record<Difficulty, number> = {
  1: 1.5,  // Tourist
  2: 1.25, // Traveler
  3: 1.0,  // Explorer
  4: 0.75, // Cartographer
  5: 0.5,  // Navigator
};

/** Radius (km) of the circle the player is claiming. */
export function claimRadiusKm(
  diagonalKm: number,
  difficulty: Difficulty,
  confidence: ConfidenceLevel,
): number {
  return diagonalKm * CONFIDENCE_TIERS[confidence].radiusFraction * DIFFICULTY_RADIUS_SCALE[difficulty];
}

/**
 * Score a guess against the claimed circle.
 * Outside the circle → 0. Inside → maxPoints at the centre, falling linearly
 * to half of maxPoints at the edge.
 */
export function scoreGuess(
  distanceKm: number,
  radiusKm: number,
  confidence: ConfidenceLevel,
): number {
  if (distanceKm > radiusKm) return 0;
  const { maxPoints } = CONFIDENCE_TIERS[confidence];
  return Math.round(maxPoints * (1 - 0.5 * (distanceKm / radiusKm)));
}
