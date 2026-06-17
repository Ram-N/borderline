import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { parseSvg } from '../utils/parseSvg';
import { computeCentroid } from '../utils/computeCentroid';
import { REGION_CONFIG } from '../data/regionConfig';
import { type AdjacencyData } from '../utils/generatePuzzle';
import useDailyPuzzleEngine, { DIFFICULTY_LABELS } from '../hooks/useDailyPuzzleEngine';
import { useCannedDailyPuzzles } from '../hooks/useCannedDailyEngine';
import type { RegionSlot } from '../hooks/usePuzzleEngine';
import type { Puzzle } from '../types/puzzle';
import PuzzleMapView from '../components/PuzzleMapView';
import PuzzleChoices from '../components/PuzzleChoices';
import TextAnswer from '../components/TextAnswer';
import ScorePanel from '../components/ScorePanel';

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function DailyPlay() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [seed, setSeed] = useState<string | null>(null);
  const [adjacency, setAdjacency] = useState<AdjacencyData | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});
  const [regionPool, setRegionPool] = useState<RegionSlot[] | null>(null);

  // Try canned daily puzzles
  const today = todayString();
  const cannedDaily = useCannedDailyPuzzles(today);

  // Auth gate
  if (!user) {
    return (
      <div className='daily-auth-gate'>
        <h2>Daily Puzzle</h2>
        <p>Sign in to play today's puzzle and track your streak.</p>
        <button className='start-btn' onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </div>
    );
  }

  // Check for existing attempt + fetch seed
  useEffect(() => {
    if (!user) return;
    const today = todayString();

    Promise.all([
      supabase
        .from('daily_attempts')
        .select('score')
        .eq('user_id', user.id)
        .eq('puzzle_date', today)
        .maybeSingle(),
      supabase.rpc('get_daily_seed', { query_date: today }),
    ]).then(([attemptRes, seedRes]) => {
      if (attemptRes.data?.score != null) {
        setPreviousScore(attemptRes.data.score);
      }
      const seedVal = (seedRes.data as any)?.seed ?? today;
      setSeed(seedVal);
      setLoading(false);
    });
  }, [user]);

  // Load world region data (same as "any" mode in PuzzlePlay)
  useEffect(() => {
    const worldKeys = Object.entries(REGION_CONFIG)
      .filter(([, c]) => c.group === 'world')
      .map(([key]) => key);

    Promise.all([
      fetch('/data/adjacency.json').then(r => r.json()),
      ...worldKeys.map(key =>
        parseSvg(REGION_CONFIG[key].svgMap).then(({ paths }) => ({ key, paths }))
      ),
    ]).then(([adj, ...regionData]) => {
      const worldAdj = adj as AdjacencyData;
      // Build authoritative country names from adjacency data first,
      // then fill gaps from SVG titles (SVG titles can be region-specific
      // e.g. "ES" is "Spain" in Europe but "Canary Islands" in Africa)
      const names: Record<string, string> = {};
      Object.entries(worldAdj).forEach(([code, data]) => {
        names[code] = data.name;
      });
      const pool: RegionSlot[] = regionData.map(({ key, paths }: any) => {
        const codes = paths.map((p: any) => p.id);
        paths.forEach((p: any) => { if (!names[p.id]) names[p.id] = p.title || p.id; });
        const vt = new Set<string>(paths.filter((p: any) => {
          const c = computeCentroid(p.d);
          return c.w * c.h >= 100;
        }).map((p: any) => p.id as string));
        return { adjacency: worldAdj, regionCodes: codes, svgMap: REGION_CONFIG[key].svgMap, region: key, validTargets: vt };
      });
      setAdjacency(worldAdj);
      setCountryNames(names);
      setRegionPool(pool);
    });
  }, []);

  // Wait for auth check + canned loading; runtime data only needed if no canned puzzles
  if (loading || cannedDaily.loading) {
    return <div className='loading'>Loading daily puzzle…</div>;
  }
  if (!cannedDaily.available && (!seed || !adjacency || !regionPool)) {
    return <div className='loading'>Loading daily puzzle…</div>;
  }

  // Already played today
  if (previousScore !== null) {
    return (
      <AlreadyPlayed score={previousScore} />
    );
  }

  return (
    <DailyPuzzleContent
      seed={seed ?? today}
      adjacency={adjacency ?? ({} as AdjacencyData)}
      countryNames={countryNames}
      regionPool={regionPool ?? []}
      preloadedPuzzles={cannedDaily.available ? cannedDaily.puzzles : undefined}
    />
  );
}

function AlreadyPlayed({ score }: { score: number }) {
  const [streak, setStreak] = useState<{ current: number; best: number } | null>(null);

  useEffect(() => {
    supabase.rpc('get_user_stats').then(({ data }) => {
      if (data) {
        const d = data as unknown as { current_streak: number; max_streak: number };
        setStreak({ current: d.current_streak, best: d.max_streak });
      }
    });
  }, []);

  return (
    <div className='daily-already-played'>
      <h2>Daily Puzzle</h2>
      <p>You already played today's puzzle!</p>
      <p className='daily-score'>Score: {score} / 15</p>
      {streak && (
        <p className='daily-streak-info'>
          Current streak: <strong>{streak.current}</strong> &middot; Best: <strong>{streak.best}</strong>
        </p>
      )}
      <p>Come back tomorrow for a new puzzle.</p>
    </div>
  );
}

function DailyPuzzleContent({
  seed,
  adjacency,
  countryNames,
  regionPool,
  preloadedPuzzles,
}: {
  seed: string;
  adjacency: AdjacencyData;
  countryNames: Record<string, string>;
  regionPool: RegionSlot[];
  preloadedPuzzles?: Puzzle[];
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const engine = useDailyPuzzleEngine({ seed, regionPool, adjacency, preloadedPuzzles });
  const { puzzles, index, total, phase, selected, score, done, results, currentDifficulty, select, next } = engine;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && phase === 'reveal') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, next]);

  useEffect(() => {
    if (!done) return;

    const today = todayString();
    supabase.rpc('submit_daily_attempt', {
      attempt_date: today,
      attempt_score: score,
    }).then(() => {
      window.dispatchEvent(new Event('streak-updated'));
      navigate('/results', {
        state: { score, total: 15, daily: true, results },
      });
    });
  }, [done]);

  if (total === 0) return <div>Could not generate daily puzzles.</div>;
  if (done) return <div className='loading'>Saving score…</div>;

  const puzzle = puzzles[index];
  const diffLabel = DIFFICULTY_LABELS[currentDifficulty - 1];

  const prompt = puzzle.type === 'hidden_country'
    ? 'Which country is shown in orange?'
    : 'Name the orange country.';

  return (
    <div className='play'>
      <div className='daily-header'>
        <span className='daily-badge'>Daily Puzzle</span>
        <span className='daily-level'>Level {currentDifficulty} — {diffLabel}</span>
      </div>
      <ScorePanel index={index} total={total} score={score} />
      <p className='puzzle-prompt'>{prompt}</p>
      <PuzzleMapView
        svgMap={puzzle.svgMap}
        puzzle={puzzle}
        phase={phase}
        selectedAnswer={selected}
        countryNames={countryNames}
        difficulty={currentDifficulty}
      />
      {currentDifficulty === 5 ? (
        <TextAnswer
          key={index}
          correctAnswer={puzzle.correctAnswer}
          countryNames={countryNames}
          phase={phase}
          selected={selected}
          onSubmit={select}
        />
      ) : (
        <PuzzleChoices
          choices={puzzle.choices}
          countryNames={countryNames}
          selected={selected}
          correct={puzzle.correctAnswer}
          phase={phase}
          onSelect={select}
        />
      )}
      {phase === 'reveal' && (
        <div className='controls'>
          <button className='start-btn' onClick={next}>Next</button>
        </div>
      )}
    </div>
  );
}
