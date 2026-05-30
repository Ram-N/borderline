import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Stats {
  current_streak: number;
  max_streak: number;
}

export default function StreakBadge() {
  const [stats, setStats] = useState<Stats | null>(null);

  function fetchStats() {
    supabase.rpc('get_user_stats').then(({ data, error }) => {
      if (error) {
        console.error('get_user_stats error:', error);
        return;
      }
      if (data) setStats(data as unknown as Stats);
    });
  }

  useEffect(() => {
    fetchStats();
    window.addEventListener('streak-updated', fetchStats);
    window.addEventListener('profile-ready', fetchStats);
    return () => {
      window.removeEventListener('streak-updated', fetchStats);
      window.removeEventListener('profile-ready', fetchStats);
    };
  }, []);

  if (!stats || stats.current_streak === 0) return null;

  return (
    <div className="streak-badge" title={`Best: ${stats.max_streak}`}>
      <span className="streak-fire">&#x1F525;</span>
      <span className="streak-count">{stats.current_streak}</span>
    </div>
  );
}
