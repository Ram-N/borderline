import { useState, useCallback } from 'react';
import type { RegionDataset, RegionTarget, CityTarget, RegionMode, WhereIsRegionRound } from '../../types/landmark/region';
import type { Difficulty, GamePhase, ConfidenceLevel } from '../../types/landmark/game';
import { svgToGeo, parseViewBox } from '../../utils/landmark/coordTransform';
import { haversineKm, distanceToPolygonsKm, mapDiagonalKm, claimRadiusKm, scoreGuess } from '../../utils/landmark/distanceScore';
import { pointInPolygon } from '../../utils/landmark/pointInPolygon';

type Config = {
  dataset: RegionDataset;
  difficulty: Difficulty;
  mode: RegionMode;
  n: number;
};

type State = {
  rounds: WhereIsRegionRound[];
  currentIndex: number;
  phase: GamePhase;
  totalScore: number;
  diagonalKm: number;
  pendingConfidence: ConfidenceLevel | null;
  pendingPin: { svgX: number; svgY: number } | null;
};

type Engine = {
  rounds: WhereIsRegionRound[];
  currentIndex: number;
  total: number;
  phase: GamePhase;
  totalScore: number;
  diagonalKm: number;
  pendingConfidence: ConfidenceLevel | null;
  pendingPin: { svgX: number; svgY: number } | null;
  done: boolean;
  radiusKmFor: (level: ConfidenceLevel) => number;
  setConfidence: (level: ConfidenceLevel) => void;
  placePin: (svgX: number, svgY: number) => void;
  confirm: () => void;
  next: () => void;
};

/** Points for a pin inside the target region, regardless of confidence. */
const INSIDE_REGION_POINTS = 100;

function pickTargets(dataset: RegionDataset, mode: RegionMode, n: number): WhereIsRegionRound[] {
  const pool: Array<RegionTarget | CityTarget> =
    mode === 'regions' ? [...dataset.regions] : [...dataset.cities];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length)).map((target) => ({ target, mode }));
}

export default function useWhereIsRegionEngine({
  dataset,
  difficulty,
  mode,
  n,
}: Config): Engine {
  const [state] = useState<Pick<State, 'diagonalKm'>>(() => ({
    diagonalKm: mapDiagonalKm(dataset.bounds),
  }));

  const [gameState, setGameState] = useState<Omit<State, 'diagonalKm'>>(() => ({
    rounds: pickTargets(dataset, mode, n),
    currentIndex: 0,
    phase: 'question',
    totalScore: 0,
    pendingConfidence: null,
    pendingPin: null,
  }));

  const diagonalKm = state.diagonalKm;

  const radiusKmFor = useCallback(
    (level: ConfidenceLevel) => claimRadiusKm(diagonalKm, difficulty, level),
    [diagonalKm, difficulty],
  );

  const setConfidence = useCallback((level: ConfidenceLevel) => {
    setGameState((prev) => ({ ...prev, pendingConfidence: level }));
  }, []);

  const placePin = useCallback((svgX: number, svgY: number) => {
    setGameState((prev) => ({ ...prev, pendingPin: { svgX, svgY } }));
  }, []);

  const confirm = useCallback(() => {
    setGameState((prev) => {
      if (!prev.pendingPin || !prev.pendingConfidence) return prev;
      if (prev.phase !== 'question') return prev;

      const round = prev.rounds[prev.currentIndex];
      const svgDims = parseViewBox(dataset.viewBox);
      const { lat: pinLat, lon: pinLon } = svgToGeo(
        prev.pendingPin.svgX,
        prev.pendingPin.svgY,
        dataset.bounds,
        svgDims,
      );

      const target = round.target;
      let distanceKm: number;
      let insideRegion: boolean | undefined;
      const confidence = prev.pendingConfidence;
      const radiusKm = radiusKmFor(confidence);
      let finalScore: number;

      if (round.mode === 'regions') {
        // Regions are areas: inside is a full hit, otherwise measure to the nearest border
        const { polygons } = target as RegionTarget;
        insideRegion = polygons.some(poly => pointInPolygon(pinLat, pinLon, poly));
        distanceKm = insideRegion ? 0 : distanceToPolygonsKm(pinLat, pinLon, polygons);
      } else {
        distanceKm = haversineKm(pinLat, pinLon, target.lat, target.lon);
      }
      finalScore = insideRegion ? INSIDE_REGION_POINTS : scoreGuess(distanceKm, radiusKm, confidence);

      const updatedRound: WhereIsRegionRound = {
        ...round,
        confidence: prev.pendingConfidence,
        placedPin: prev.pendingPin,
        distanceKm,
        insideRegion,
        radiusKm,
        finalScore,
      };

      const updatedRounds = [...prev.rounds];
      updatedRounds[prev.currentIndex] = updatedRound;

      return {
        ...prev,
        rounds: updatedRounds,
        phase: 'reveal',
        totalScore: prev.totalScore + finalScore,
      };
    });
  }, [dataset, radiusKmFor]);

  const next = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      phase: 'question',
      pendingConfidence: null,
      pendingPin: null,
    }));
  }, []);

  return {
    rounds: gameState.rounds,
    currentIndex: gameState.currentIndex,
    total: gameState.rounds.length,
    phase: gameState.phase,
    totalScore: gameState.totalScore,
    diagonalKm,
    pendingConfidence: gameState.pendingConfidence,
    pendingPin: gameState.pendingPin,
    done: gameState.currentIndex >= gameState.rounds.length,
    radiusKmFor,
    setConfidence,
    placePin,
    confirm,
    next,
  };
}
