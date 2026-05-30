import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function ScoreCalendar() {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const ref = useRef<HTMLDivElement>(null);

  function fetchScores() {
    supabase
      .rpc('get_score_history', { limit_count: 90 })
      .then(({ data, error }) => {
        if (error) {
          console.error('get_score_history error:', error);
          return;
        }
        if (!data) return;
        const map = new Map<string, number>();
        (data as { date: string; score: number }[]).forEach(r => map.set(r.date, r.score));
        setScores(map);
      });
  }

  useEffect(() => {
    fetchScores();
    window.addEventListener('streak-updated', fetchScores);
    window.addEventListener('profile-ready', fetchScores);
    return () => {
      window.removeEventListener('streak-updated', fetchScores);
      window.removeEventListener('profile-ready', fetchScores);
    };
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const today = toDateKey(new Date());
  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();

  function prevMonth() {
    setMonth(new Date(year, mo - 1, 1));
  }
  function nextMonth() {
    setMonth(new Date(year, mo + 1, 1));
  }

  const monthLabel = month.toLocaleString('default', { month: 'long', year: 'numeric' });

  function scoreClass(dateKey: string): string {
    const s = scores.get(dateKey);
    if (s == null) return '';
    if (s >= 12) return 'score-high';
    if (s >= 8) return 'score-mid';
    return 'score-low';
  }

  const cells: React.ReactNode[] = [];
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e${i}`} className="calendar-day empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isFuture = dateKey > today;
    const isToday = dateKey === today;
    const cls = [
      'calendar-day',
      isFuture ? 'future' : scoreClass(dateKey),
      isToday ? 'today' : '',
    ].filter(Boolean).join(' ');

    cells.push(
      <div key={dateKey} className={cls} title={scores.has(dateKey) ? `Score: ${scores.get(dateKey)}` : ''}>
        {d}
      </div>
    );
  }

  return (
    <div className="calendar-wrap" ref={ref}>
      <button className="calendar-toggle" onClick={() => setOpen(o => !o)} aria-label="Score calendar">
        &#x1F4C5;
      </button>
      {open && (
        <div className="calendar-dropdown">
          <div className="calendar-nav">
            <button onClick={prevMonth} aria-label="Previous month">&lsaquo;</button>
            <span>{monthLabel}</span>
            <button onClick={nextMonth} aria-label="Next month">&rsaquo;</button>
          </div>
          <div className="calendar-grid">
            {DAY_LABELS.map(l => (
              <div key={l} className="calendar-day-label">{l}</div>
            ))}
            {cells}
          </div>
        </div>
      )}
    </div>
  );
}
