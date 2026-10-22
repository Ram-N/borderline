import type { Landmark } from './landmark';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type GamePhase = 'question' | 'reveal';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type WhereIsItRound = {
  landmark: Landmark;
  confidence?: ConfidenceLevel;
  placedPin?: { svgX: number; svgY: number };
  distanceKm?: number;
  radiusKm?: number; // radius of the confidence circle the player claimed
  finalScore?: number;
};
