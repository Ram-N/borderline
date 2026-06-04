import { useEffect, useState } from 'react';

type AuditEntry = {
  region: string;
  countryCode: string;
  countryName: string;
  issue: string;
};

type AuditData = {
  generatedAt: string;
  issues: AuditEntry[];
};

export default function QaNeighborAudit() {
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/data/puzzles/audit/neighbor-audit.json')
      .then(r => {
        if (!r.ok) throw new Error('Run `npm run puzzles:audit` first');
        return r.json();
      })
      .then(data => setAudit(data as AuditData))
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div><h2>Neighbor Audit</h2><p style={{ color: 'red' }}>{error}</p></div>;
  if (!audit) return <div className="loading">Loading audit…</div>;

  return (
    <div className="qa-neighbor-audit">
      <h2>Neighbor Audit ({audit.issues.length} issues)</h2>
      <p style={{ fontSize: '0.8rem', color: '#999' }}>Generated: {audit.generatedAt}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '4px' }}>Region</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '4px' }}>Country</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '4px' }}>Issue</th>
          </tr>
        </thead>
        <tbody>
          {audit.issues.map((issue, i) => (
            <tr key={i}>
              <td style={{ padding: '4px' }}>{issue.region}</td>
              <td style={{ padding: '4px' }}>{issue.countryName || issue.countryCode || '—'}</td>
              <td style={{ padding: '4px' }}>{issue.issue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
