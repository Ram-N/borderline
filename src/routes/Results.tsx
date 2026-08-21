
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DIFFICULTY_LABELS = ['Tourist', 'Traveler', 'Explorer', 'Cartographer', 'Diplomat'];

function scoreRating(score: number, total: number): { label: string; color: string } {
  const pct = score / total;
  if (pct >= 1) return { label: 'Perfect!', color: '#1B5E20' };
  if (pct >= 0.8) return { label: 'Great job!', color: '#2E7D32' };
  if (pct >= 0.6) return { label: 'Well done', color: '#F57F17' };
  if (pct >= 0.4) return { label: 'Not bad', color: '#E65100' };
  return { label: 'Keep practicing', color: '#B71C1C' };
}

function DailyBreakdown({ results, score, correctAnswers }: { results: boolean[]; score: number; correctAnswers?: string[] }) {
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    supabase.rpc('get_user_stats').then(({ data }) => {
      if (data) {
        const d = data as unknown as { current_streak: number };
        setStreak(d.current_streak);
      }
    });
  }, []);

  const shareGrid = results.map((correct) => correct ? '\u{1f7e9}' : '\u{1f7e5}').join('');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isPerfect = results.every(Boolean);
  const teaser = isPerfect ? 'Perfect score!' : 'Can you beat my score?';
  const streakLine = streak && streak > 1 ? `🔥 ${streak}-day streak\n` : '';
  const shareText = `Borderline Daily — ${dateStr}\n${shareGrid} ${score}/15${isPerfect ? ' ⭐' : ''}\n${streakLine}${teaser}\n${window.location.origin}/daily`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Borderline Daily', text: shareText });
      } catch {
        // User cancelled — ignore
      }
    }
  }

  return (
    <div className='daily-breakdown'>
      <h3>Breakdown</h3>
      <ul className='daily-levels'>
        {results.map((correct, i) => (
          <li key={i} className={correct ? 'level-correct' : 'level-wrong'}>
            <span>Level {i + 1} — {DIFFICULTY_LABELS[i]}</span>
            <span>
              {correct ? `+${i + 1}` : '0'} pts
              {!correct && correctAnswers?.[i] && (
                <span className='level-answer'> — Answer: {correctAnswers[i]}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className='results-share-row'>
        <button
          className='results-btn results-btn-secondary'
          onClick={handleCopy}
        >
          {copied ? '✓ Copied!' : '📋 Copy results'}
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            className='results-btn results-btn-secondary'
            onClick={handleShare}
          >
            📤 Share
          </button>
        )}
      </div>
    </div>
  );
}

function useConfetti(trigger: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fire = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8C00'];
    const pieces: { x: number; y: number; w: number; h: number; color: string; vx: number; vy: number; rot: number; vr: number; opacity: number }[] = [];

    for (let i = 0; i < 150; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    let frame = 0;
    function animate() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        p.x += p.vx;
        p.vy += 0.05;
        p.y += p.vy;
        p.rot += p.vr;
        if (frame > 60) p.opacity = Math.max(0, p.opacity - 0.008);
        if (p.opacity <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (trigger) fire();
    return () => { canvasRef.current?.remove(); };
  }, [trigger, fire]);
}

export default function Results() {
  const loc = useLocation() as any;
  const score = loc.state?.score;
  const total = loc.state?.total;
  const daily = loc.state?.daily;
  const results: boolean[] | undefined = loc.state?.results;
  const correctAnswers: string[] | undefined = loc.state?.correctAnswers;

  const isPerfect = score != null && total != null && score === total;
  useConfetti(isPerfect);

  if (score == null) {
    return <Navigate to='/' replace />;
  }

  const rating = scoreRating(score, total);
  const pct = Math.round((score / total) * 100);

  return (
    <div className='results-page'>
      <div className='results-card'>
        <h2 className='results-title'>{daily ? 'Daily Puzzle' : 'Results'}</h2>
        <div className='results-score-ring' style={{ borderColor: rating.color }}>
          <span className='results-score-num'>{score}</span>
          <span className='results-score-den'>/ {total}</span>
        </div>
        <p className='results-pct' style={{ color: rating.color }}>{pct}% — {rating.label}</p>
        {daily && results && <DailyBreakdown results={results} score={score} correctAnswers={correctAnswers} />}
        <div className='results-actions'>
          {daily ? (
            <Link to='/' className='results-btn results-btn-primary'>Back to home</Link>
          ) : (
            <>
              <Link to='/' className='results-btn results-btn-primary'>Play again</Link>
              <Link to='/play' className='results-btn results-btn-secondary'>Change settings</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
