import { useEffect, useState } from 'react';
import { LANDMARK_MAP_CONFIG } from '../../data/landmarkMapConfig';
import { hashSeed, mulberry32, seededShuffle } from '../../utils/seededRandom';
import type { Landmark, LandmarkDataset } from '../../types/landmark/landmark';

export interface LandmarkChoice {
  id: string;
  name: string;
  isCorrect: boolean;
}

export interface SelectRound {
  mapId: string;
  mapName: string;
  isLabeled: boolean;
  dataset: LandmarkDataset;
  pins: Landmark[];
  choices: LandmarkChoice[];
  pointsPerCorrect: 2 | 3;
  maxPoints: 6;
}

export interface DailyLandmarkSelectPuzzle {
  date: string;
  phase1: SelectRound;
  phase2: SelectRound;
  maxScore: 12;
}

export default function useDailyLandmarkSelectEngine(date: string): {
  puzzle: DailyLandmarkSelectPuzzle | null;
  error: string | null;
} {
  const [puzzle, setPuzzle] = useState<DailyLandmarkSelectPuzzle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPuzzle(null);
    setError(null);

    async function build() {
      try {
        const rng = mulberry32(hashSeed(date));
        const allKeys = Object.keys(LANDMARK_MAP_CONFIG);

        // Pick phase 1 map: shuffle all keys, take first
        const shuffledAll = seededShuffle(allKeys, rng);
        const phase1Key = shuffledAll[0];

        // Pick phase 2 map: shuffle remaining keys, take first
        const remaining = shuffledAll.slice(1);
        const shuffledRemaining = seededShuffle(remaining, rng);
        const phase2Key = shuffledRemaining[0];

        // Load both datasets in parallel
        const [ds1, ds2]: [LandmarkDataset, LandmarkDataset] = await Promise.all([
          fetch(LANDMARK_MAP_CONFIG[phase1Key].dataUrl).then((r) => r.json()),
          fetch(LANDMARK_MAP_CONFIG[phase2Key].dataUrl).then((r) => r.json()),
        ]);

        // Phase 1: 3 pins + 3 distractors
        const shuffledP1 = seededShuffle([...ds1.landmarks], rng);
        const p1Pins = shuffledP1.slice(0, 3);
        const p1Distractors = shuffledP1.slice(3, 6);
        const p1ChoicesRaw: LandmarkChoice[] = [
          ...p1Pins.map((l) => ({ id: l.id, name: l.name, isCorrect: true })),
          ...p1Distractors.map((l) => ({ id: l.id, name: l.name, isCorrect: false })),
        ];
        const p1Choices = seededShuffle(p1ChoicesRaw, rng);

        // Phase 2: 2 pins + 3 distractors
        const shuffledP2 = seededShuffle([...ds2.landmarks], rng);
        const p2Pins = shuffledP2.slice(0, 2);
        const p2Distractors = shuffledP2.slice(2, 5);
        const p2ChoicesRaw: LandmarkChoice[] = [
          ...p2Pins.map((l) => ({ id: l.id, name: l.name, isCorrect: true })),
          ...p2Distractors.map((l) => ({ id: l.id, name: l.name, isCorrect: false })),
        ];
        const p2Choices = seededShuffle(p2ChoicesRaw, rng);

        setPuzzle({
          date,
          phase1: {
            mapId: phase1Key,
            mapName: LANDMARK_MAP_CONFIG[phase1Key].label,
            isLabeled: true,
            dataset: ds1,
            pins: p1Pins,
            choices: p1Choices,
            pointsPerCorrect: 2,
            maxPoints: 6,
          },
          phase2: {
            mapId: phase2Key,
            mapName: LANDMARK_MAP_CONFIG[phase2Key].label,
            isLabeled: false,
            dataset: ds2,
            pins: p2Pins,
            choices: p2Choices,
            pointsPerCorrect: 3,
            maxPoints: 6,
          },
          maxScore: 12,
        });
      } catch {
        setError('Failed to load daily puzzle.');
      }
    }

    build();
  }, [date]);

  return { puzzle, error };
}
