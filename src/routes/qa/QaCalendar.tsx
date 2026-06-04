import { useEffect, useState } from 'react';
import type { DailyCalendar } from '../../types/puzzleDb';

export default function QaCalendar() {
  const [calendar, setCalendar] = useState<DailyCalendar | null>(null);
  const [error, setError] = useState('');
  const [year, setYear] = useState(2026);

  useEffect(() => {
    fetch(`/data/puzzles/calendar/${year}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`No calendar for ${year}. Run: npm run puzzles:calendar`);
        return r.json();
      })
      .then(data => setCalendar(data as DailyCalendar))
      .catch(e => { setError(e.message); setCalendar(null); });
  }, [year]);

  if (error) return <div><h2>Calendar</h2><p style={{ color: 'red' }}>{error}</p></div>;
  if (!calendar) return <div className="loading">Loading calendar…</div>;

  // Group entries by month
  const byMonth: Record<string, typeof calendar.entries> = {};
  for (const entry of calendar.entries) {
    const month = entry.date.slice(0, 7); // YYYY-MM
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(entry);
  }

  return (
    <div className="qa-calendar">
      <h2>Daily Calendar — {year}</h2>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => setYear(y => y - 1)}>← {year - 1}</button>
        <span style={{ margin: '0 8px' }}>{year}</span>
        <button onClick={() => setYear(y => y + 1)}>{year + 1} →</button>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#999' }}>
        {calendar.entries.length} days,{' '}
        {calendar.entries.filter(e => e.puzzleIds.every(id => id !== '')).length} complete
      </p>

      {Object.entries(byMonth).map(([month, entries]) => (
        <div key={month} style={{ marginBottom: '16px' }}>
          <h3>{month}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', fontSize: '0.7rem' }}>
            {entries.map(entry => {
              const filled = entry.puzzleIds.filter(id => id !== '').length;
              const bg = filled === 5 ? '#1b5e20' : filled > 0 ? '#e65100' : '#b71c1c';
              return (
                <div
                  key={entry.date}
                  style={{
                    background: bg,
                    padding: '2px 4px',
                    borderRadius: '2px',
                    textAlign: 'center',
                  }}
                  title={entry.puzzleIds.join(', ')}
                >
                  {entry.date.slice(8)}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
