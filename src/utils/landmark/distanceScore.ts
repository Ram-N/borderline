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
 * Used when no diagonalKm is provided (city-scale maps).
 */
const THRESHOLDS: Record<Difficulty, { perfectKm: number; zeroKm: number }> = {
  1: { perfectKm: 5,   zeroKm: 50  }, // Tourist
  2: { perfectKm: 2,   zeroKm: 25  }, // Traveler
  3: { perfectKm: 1,   zeroKm: 15  }, // Explorer
  4: { perfectKm: 0.5, zeroKm: 10  }, // Cartographer
  5: { perfectKm: 0.2, zeroKm: 5   }, // Navigator
};

/**
 * Fractions of the map diagonal used for threshold computation on region maps.
 * zeroFraction:    fraction at which score = 0
 * perfectFraction: fraction at which score = 100 (cities mode only)
 */
const THRESHOLD_FRACTIONS: Record<Difficulty, { zeroFraction: number; perfectFraction: number }> = {
  1: { zeroFraction: 0.12, perfectFraction: 0.020 }, // Tourist
  2: { zeroFraction: 0.10, perfectFraction: 0.015 }, // Traveler
  3: { zeroFraction: 0.08, perfectFraction: 0.010 }, // Explorer
  4: { zeroFraction: 0.06, perfectFraction: 0.005 }, // Cartographer
  5: { zeroFraction: 0.04, perfectFraction: 0.003 }, // Navigator
};

/**
 * Convert a distance (km) to a 0–100 base score for a given difficulty.
 *
 * @param distanceKm  Haversine distance from pin to target.
 * @param difficulty  Game difficulty level (1–5).
 * @param diagonalKm  Optional map diagonal in km. When provided, thresholds are
 *                    derived as fractions of the diagonal (region maps). When
 *                    omitted, the hardcoded city-scale thresholds are used.
 */
export function distanceToScore(
  distanceKm: number,
  difficulty: Difficulty,
  diagonalKm?: number,
): number {
  let perfectKm: number;
  let zeroKm: number;

  if (diagonalKm !== undefined) {
    const { zeroFraction, perfectFraction } = THRESHOLD_FRACTIONS[difficulty];
    zeroKm = diagonalKm * zeroFraction;
    perfectKm = diagonalKm * perfectFraction;
  } else {
    ({ perfectKm, zeroKm } = THRESHOLDS[difficulty]);
  }

  if (distanceKm <= perfectKm) return 100;
  if (distanceKm >= zeroKm) return 0;
  // Linear interpolation between perfectKm (100) and zeroKm (0)
  return Math.round(
    100 * (1 - (distanceKm - perfectKm) / (zeroKm - perfectKm)),
  );
}

/**
 * Apply confidence multiplier to a base score.
 * - low:    0.5× but guaranteed floor of 15 pts ("I'm guessing — give me something")
 * - medium: 1.0×
 * - high:   1.4×, but 0 if baseScore < 25 (overconfidence penalty)
 */
export function applyConfidence(
  baseScore: number,
  confidence: ConfidenceLevel,
): number {
  switch (confidence) {
    case 'low':
      return Math.max(15, Math.round(baseScore * 0.5));
    case 'medium':
      return baseScore;
    case 'high':
      if (baseScore < 25) return 0;
      return Math.min(100, Math.round(baseScore * 1.4));
  }
}
