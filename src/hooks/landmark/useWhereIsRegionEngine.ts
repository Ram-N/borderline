import { useState, useCallback } from 'react';
import type { RegionDataset, RegionTarget, CityTarget, RegionMode, WhereIsRegionRound } from '../../types/landmark/region';
import type { Difficulty, GamePhase, ConfidenceLevel } from '../../types/landmark/game';
import { svgToGeo, parseViewBox } from '../../utils/landmark/coordTransform';
import { haversineKm, distanceToScore, applyConfidence } from '../../utils/landmark/distanceScore';
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
  setConfidence: (level: ConfidenceLevel) => void;
  placePin: (svgX: number, svgY: number) => void;
  confirm: () => void;
  next: () => void;
};

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
  const [state] = useState<Pick<State, 'diagonalKm'>>(() => {
    const { minLat, maxLat, minLon, maxLon } = dataset.bounds;
    const diagonalKm = haversineKm(minLat, minLon, maxLat, maxLon);
    return { diagonalKm };
  });

  const [gameState, setGameState] = useState<Omit<State, 'diagonalKm'>>(() => ({
    rounds: pickTargets(dataset, mode, n),
    currentIndex: 0,
    phase: 'question',
    totalScore: 0,
    pendingConfidence: null,
    pendingPin: null,
  }));

  const diagonalKm = state.diagonalKm;

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
      let baseScore: number;

      if (round.mode === 'regions') {
        const regionTarget = target as RegionTarget;
        insideRegion = regionTarget.polygons.some(poly => pointInPolygon(pinLat, pinLon, poly));
        if (insideRegion) {
          distanceKm = 0;
          baseScore = 100;
        } else {
          distanceKm = haversineKm(pinLat, pinLon, target.lat, target.lon);
          baseScore = distanceToScore(distanceKm, difficulty, diagonalKm);
        }
      } else {
        distanceKm = haversineKm(pinLat, pinLon, target.lat, target.lon);
        baseScore = distanceToScore(distanceKm, difficulty, diagonalKm);
      }

      const finalScore = applyConfidence(baseScore, prev.pendingConfidence);

      const updatedRound: WhereIsRegionRound = {
        ...round,
        confidence: prev.pendingConfidence,
        placedPin: prev.pendingPin,
        distanceKm,
        insideRegion,
        baseScore,
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
  }, [dataset, difficulty, diagonalKm]);

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
    setConfidence,
    placePin,
    confirm,
    next,
  };
}
