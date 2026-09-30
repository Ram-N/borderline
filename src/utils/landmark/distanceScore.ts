import type { Difficulty } from '../../types/landmark/game';
import type { ConfidenceLevel } from '../../types/landmark/game';

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

/**
 * Scoring thresholds per difficulty level.
 * perfectKm: distance at which score = 100
 * zeroKm:    distance at which score = 0
 */
const THRESHOLDS: Record<Difficulty, { perfectKm: number; zeroKm: number }> = {
  1: { perfectKm: 5,   zeroKm: 50  }, // Tourist
  2: { perfectKm: 2,   zeroKm: 25  }, // Traveler
  3: { perfectKm: 1,   zeroKm: 15  }, // Explorer
  4: { perfectKm: 0.5, zeroKm: 10  }, // Cartographer
  5: { perfectKm: 0.2, zeroKm: 5   }, // Navigator
};

/** Convert a distance (km) to a 0–100 base score for a given difficulty. */
export function distanceToScore(distanceKm: number, difficulty: Difficulty): number {
  const { perfectKm, zeroKm } = THRESHOLDS[difficulty];
  if (distanceKm <= perfectKm) return 100;
  if (distanceKm >= zeroKm) return 0;
  // Linear interpolation between perfectKm (100) and zeroKm (0)
  return Math.round(
    100 * (1 - (distanceKm - perfectKm) / (zeroKm - perfectKm)),
  );
}

/**
 * Apply confidence multiplier to a base score.
 * - low:    0.7× (no penalty)
 * - medium: 1.0×
 * - high:   1.4×, but 0 if baseScore < 50 (overconfidence penalty)
 */
export function applyConfidence(
  baseScore: number,
  confidence: ConfidenceLevel,
): number {
  switch (confidence) {
    case 'low':
      return Math.round(baseScore * 0.7);
    case 'medium':
      return baseScore;
    case 'high':
      if (baseScore < 50) return 0;
      return Math.min(100, Math.round(baseScore * 1.4));
  }
}
