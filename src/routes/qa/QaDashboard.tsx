import { Link } from 'react-router-dom';

export default function QaDashboard() {
  return (
    <div className="qa-dashboard">
      <h2>QA Dashboard</h2>
      <ul>
        <li><Link to="/qa/render">Render Single Puzzle</Link> — Country dropdown + render + diagnostics</li>
        <li><Link to="/qa/render-all">Render Batch</Link> — All countries pass/fail table</li>
        <li><Link to="/qa/neighbors">Neighbor Audit</Link> — Cross-reference adjacency vs SVG</li>
        <li><Link to="/qa/puzzles">Puzzle Browser</Link> — Filterable table from index.json</li>
        <li><Link to="/qa/distribution">Distribution</Link> — Country/difficulty/continent frequency</li>
        <li><Link to="/qa/calendar">Calendar</Link> — Visualize daily calendar</li>
      </ul>
    </div>
  );
}
