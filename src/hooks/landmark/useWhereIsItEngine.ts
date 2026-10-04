import { useState, useCallback } from 'react';
import type { LandmarkDataset } from '../../types/landmark/landmark';
import type {
  Difficulty,
  GamePhase,
  ConfidenceLevel,
  WhereIsItRound,
} from '../../types/landmark/game';
import { svgToGeo, parseViewBox } from '../../utils/landmark/coordTransform';
import { haversineKm, distanceToScore, applyConfidence } from '../../utils/landmark/distanceScore';

type Config = {
  dataset: LandmarkDataset;
  difficulty: Difficulty;
  n: number; // number of rounds
  diagonalKm?: number; // if provided, score thresholds scale with map size
};

type State = {
  rounds: WhereIsItRound[];
  currentIndex: number;
  phase: GamePhase;
  totalScore: number;
  // Pending values — set before confirm()
  pendingConfidence: ConfidenceLevel | null;
  pendingPin: { svgX: number; svgY: number } | null;
};

type Engine = {
  rounds: WhereIsItRound[];
  currentIndex: number;
  total: number;
  phase: GamePhase;
  totalScore: number;
  pendingConfidence: ConfidenceLevel | null;
  pendingPin: { svgX: number; svgY: number } | null;
  done: boolean;
  setConfidence: (level: ConfidenceLevel) => void;
  placePin: (svgX: number, svgY: number) => void;
  confirm: () => void;
  next: () => void;
};

/** Pick n landmarks at random (without replacement) from the dataset. */
function pickLandmarks(dataset: LandmarkDataset, n: number): WhereIsItRound[] {
  const pool = [...dataset.landmarks];
  // Simple Fisher-Yates with Math.random (non-seeded for now)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length)).map((landmark) => ({ landmark }));
}

export default function useWhereIsItEngine({
  dataset,
  difficulty,
  n,
  diagonalKm,
}: Config): Engine {
  const [state, setState] = useState<State>(() => ({
    rounds: pickLandmarks(dataset, n),
    currentIndex: 0,
    phase: 'question',
    totalScore: 0,
    pendingConfidence: null,
    pendingPin: null,
  }));

  const setConfidence = useCallback((level: ConfidenceLevel) => {
    setState((prev) => ({ ...prev, pendingConfidence: level }));
  }, []);

  const placePin = useCallback((svgX: number, svgY: number) => {
    setState((prev) => ({ ...prev, pendingPin: { svgX, svgY } }));
  }, []);

  const confirm = useCallback(() => {
    setState((prev) => {
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

      const { lat: correctLat, lon: correctLon } = round.landmark;
      const distanceKm = haversineKm(pinLat, pinLon, correctLat, correctLon);
      const baseScore = distanceToScore(distanceKm, difficulty, diagonalKm);
      const finalScore = applyConfidence(baseScore, prev.pendingConfidence);

      const updatedRound: WhereIsItRound = {
        ...round,
        confidence: prev.pendingConfidence,
        placedPin: prev.pendingPin,
        distanceKm,
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
  }, [dataset, difficulty]);

  const next = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      phase: 'question',
      pendingConfidence: null,
      pendingPin: null,
    }));
  }, []);

  return {
    rounds: state.rounds,
    currentIndex: state.currentIndex,
    total: state.rounds.length,
    phase: state.phase,
    totalScore: state.totalScore,
    pendingConfidence: state.pendingConfidence,
    pendingPin: state.pendingPin,
    done: state.currentIndex >= state.rounds.length,
    setConfidence,
    placePin,
    confirm,
    next,
  };
}
