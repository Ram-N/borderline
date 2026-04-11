# Borderline — Starter Files (MVP)



## 2) `package.json`
```json
{
  "name": "borderline",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^22.5.4",
    "typescript": "^5.5.4",
    "vite": "^5.4.2"
  }
}
```

## 3) `vite.config.ts`
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

## 4) `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "."
  },
  "include": ["src"]
}
```

## 5) `index.html`
```html
<!doctype html>
<html lang='en'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Borderline</title>
  </head>
  <body>
    <div id='root'></div>
    <script type='module' src='/src/main.tsx'></script>
  </body>
</html>
```

## 6) `src/main.tsx`
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

## 7) `src/App.tsx`
```tsx
import { Routes, Route, Link } from 'react-router-dom';
import Home from './routes/Home';
import Play from './routes/Play';
import Results from './routes/Results';
import About from './routes/About';

export default function App() {
  return (
    <div className='app-wrap'>
      <header className='app-header'>
        <Link to='/' className='brand'>Borderline</Link>
        <nav>
          <Link to='/play'>Play</Link>
          <Link to='/results'>Results</Link>
          <Link to='/about'>About</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/play' element={<Play />} />
          <Route path='/results' element={<Results />} />
          <Route path='/about' element={<About />} />
        </Routes>
      </main>
    </div>
  );
}
```

## 8) `src/routes/Home.tsx`
```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegionPicker from '../components/RegionPicker';
import StartPanel from '../components/StartPanel';

export default function Home() {
  const navigate = useNavigate();
  const [manifest, setManifest] = useState<{ sets: { id: string; path: string }[] } | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [count, setCount] = useState<number>(5);

  useEffect(() => {
    fetch('/data/questions.index.json')
      .then(r => r.json())
      .then(setManifest)
      .catch(() => setManifest({ sets: [] }));
  }, []);

  function start() {
    if (!selected) return;
    const params = new URLSearchParams({ set: selected, n: String(count) });
    navigate(`/play?${params.toString()}`);
  }

  return (
    <div className='home'>
      <h1>Borderline</h1>
      <p>Image-based neighbors quiz. Pick a set and start.</p>
      <RegionPicker manifest={manifest} selected={selected} onChange={setSelected} />
      <StartPanel count={count} onCount={setCount} />
      <button onClick={start} disabled={!selected}>Start Quiz</button>
    </div>
  );
}
```

## 9) `src/routes/Play.tsx`
```tsx
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useQuizEngine from '../hooks/useQuizEngine';
import MapCard from '../components/MapCard';
import MultipleChoice from '../components/MultipleChoice';
import ScorePanel from '../components/ScorePanel';

export default function Play() {
  const navigate = useNavigate();
  const qs = new URLSearchParams(useLocation().search);
  const setPath = qs.get('set') ?? '';
  const n = Number(qs.get('n') ?? '5');

  const { question, index, total, select, selections, check, checked, score, next, done } = useQuizEngine({
    setPath,
    maxQuestions: n,
  });

  const allAnswered = useMemo(() => {
    if (!question) return false;
    return question.neighbors.every(nb => selections[nb.label]);
  }, [question, selections]);

  if (done) {
    navigate('/results', { state: { score, total } });
  }

  if (!question) return <div className='loading'>Loading…</div>;

  return (
    <div className='play'>
      <ScorePanel index={index} total={total} score={score} />
      <MapCard image={question.image} labelStyle={question.labelStyle} country={question.countryOfInterest} />
      <MultipleChoice neighbors={question.neighbors} selections={selections} onSelect={select} disabled={checked} />
      <div className='controls'>
        {!checked && <button onClick={check} disabled={!allAnswered}>Check</button>}
        {checked && <button onClick={next}>Next</button>}
      </div>
    </div>
  );
}
```

## 10) `src/routes/Results.tsx`
```tsx
import { useLocation, Link } from 'react-router-dom';

export default function Results() {
  const loc = useLocation() as any;
  const score = loc.state?.score ?? 0;
  const total = loc.state?.total ?? 0;

  return (
    <div className='results'>
      <h2>Results</h2>
      <p>Score: {score} / {total}</p>
      <Link to='/'>Play again</Link>
    </div>
  );
}
```

## 11) `src/routes/About.tsx`
```tsx
export default function About() {
  return (
    <div className='about'>
      <h2>About Borderline</h2>
      <p>Minimal MVP using pre-edited images with numbered or lettered neighbors.</p>
    </div>
  );
}
```

## 12) `src/components/RegionPicker.tsx`
```tsx
type Manifest = { sets: { id: string; path: string }[] } | null;

export default function RegionPicker({ manifest, selected, onChange }: {
  manifest: Manifest;
  selected: string;
  onChange: (v: string) => void;
}) {
  if (!manifest) return <div>Loading sets…</div>;
  if (!manifest.sets.length) return <div>No sets found</div>;
  return (
    <div className='region-picker'>
      <label>
        Set:
        <select value={selected} onChange={e => onChange(e.target.value)}>
          <option value=''>Select…</option>
          {manifest.sets.map(s => (
            <option key={s.id} value={s.path}>{s.id}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
```

## 13) `src/components/StartPanel.tsx`
```tsx
export default function StartPanel({ count, onCount }: { count: number; onCount: (n: number) => void; }) {
  return (
    <div className='start-panel'>
      <label>
        Questions:
        <input type='number' value={count} min={1} max={10} onChange={e => onCount(Number(e.target.value))} />
      </label>
      <small>Tip: keep sets small (5–10 images) for quick sessions.</small>
    </div>
  );
}
```

## 14) `src/components/MapCard.tsx`
```tsx
export default function MapCard({ image, labelStyle, country }: { image: string; labelStyle: 'numbers' | 'letters'; country: string; }) {
  return (
    <div className='map-card'>
      <div className='map-head'>
        <h3>{country}</h3>
        <span className='label-style'>Labels: {labelStyle === 'numbers' ? '1–n' : 'A–D'}</span>
      </div>
      <img src={image} alt={`Neighbors quiz for ${country}`} className='map-img' />
    </div>
  );
}
```

## 15) `src/components/MultipleChoice.tsx`
```tsx
type NeighborMC = { label: string; prompt: string; options: string[]; answer: string };

export default function MultipleChoice({ neighbors, selections, onSelect, disabled }: {
  neighbors: NeighborMC[];
  selections: Record<string, string>;
  onSelect: (label: string, option: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className='mc-wrap'>
      {neighbors.map(nb => (
        <fieldset key={nb.label} className='mc-item' disabled={disabled}>
          <legend>{nb.label}. {nb.prompt}</legend>
          {nb.options.map(opt => (
            <label key={opt} className='mc-option'>
              <input
                type='radio'
                name={`nb-${nb.label}`}
                value={opt}
                checked={selections[nb.label] === opt}
                onChange={() => onSelect(nb.label, opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
```

## 16) `src/components/ScorePanel.tsx`
```tsx
export default function ScorePanel({ index, total, score }: { index: number; total: number; score: number }) {
  return (
    <div className='score-panel'>
      <span>Question {index + 1} / {total}</span>
      <span>Score: {score}</span>
    </div>
  );
}
```

## 17) `src/hooks/useQuizEngine.ts`
```tsx
import { useEffect, useMemo, useState } from 'react';
import type { Question } from '../types/question';

export default function useQuizEngine({ setPath, maxQuestions = 5 }: { setPath: string; maxQuestions?: number }) {
  const [all, setAll] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!setPath) return;
    fetch(setPath)
      .then(r => r.json())
      .then((q) => setAll(q.questions))
      .catch(() => setAll([]));
  }, [setPath]);

  const total = useMemo(() => Math.min(all?.length ?? 0, maxQuestions), [all, maxQuestions]);
  const question = useMemo(() => (all && all[index] ? all[index] : null), [all, index]);
  const done = useMemo(() => total > 0 && index >= total, [index, total]);

  function select(label: string, option: string) {
    setSelections(prev => ({ ...prev, [label]: option }));
  }

  function check() {
    if (!question) return;
    let correct = 0;
    question.neighbors.forEach(nb => {
      if (selections[nb.label] === nb.answer) correct += 1;
    });
    setScore(s => s + correct);
    setChecked(true);
  }

  function next() {
    setIndex(i => i + 1);
    setChecked(false);
    setSelections({});
  }

  return { question, index, total, select, selections, check, checked, score, next, done } as const;
}
```

## 18) `src/types/question.ts`
```ts
export type NeighborMC = {
  label: string;
  prompt: string;
  options: string[];
  answer: string;
};

export type Question = {
  id: string;
  region: string;
  countryOfInterest: string;
  image: string;
  labelStyle: 'numbers' | 'letters';
  neighbors: NeighborMC[];
  meta?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    source?: string;
    notes?: string;
  };
};
```

## 19) `src/styles/index.css`
```css
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
.app-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eee; }
.app-header .brand { font-weight: 700; text-decoration: none; color: inherit; }
main { max-width: 900px; margin: 0 auto; padding: 16px; }
.map-card { margin: 12px 0; }
.map-img { width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; }
.score-panel { display: flex; gap: 16px; margin-bottom: 12px; }
.mc-item { margin: 10px 0; }
.controls { margin: 16px 0; display: flex; gap: 8px; }
```

## 20) `public/data/questions.index.json`
```json
{
  "sets": [
    { "id": "europe_france_set01_v1", "path": "/data/questions/europe_france_set01.json" }
  ]
}
```

## 21) `public/data/questions/europe_france_set01.json`
```json
{
  "questions": [
    {
      "id": "europe_france_set01_q1",
      "region": "Europe",
      "countryOfInterest": "France",
      "image": "/images/maps/europe/france_neighbors_v1.png",
      "labelStyle": "numbers",
      "neighbors": [
        {
          "label": "1",
          "prompt": "Bordering country number 1 is:",
          "options": ["Belgium", "Spain", "Italy", "Switzerland"],
          "answer": "Belgium"
        },
        {
          "label": "2",
          "prompt": "Bordering country number 2 is:",
          "options": ["Germany", "Luxembourg", "Andorra", "Monaco"],
          "answer": "Luxembourg"
        }
      ],
      "meta": { "difficulty": "easy", "source": "Edited image", "notes": "Neighbors numbered on image" }
    }
  ]
}
```

## 22) Image placeholders
Place your edited PNGs here:
```
public/images/maps/europe/france_neighbors_v1.png
public/images/maps/germany/germany_neighbors_v1.png
public/images/maps/africa/kenya_neighbors_v1.png
```

---

