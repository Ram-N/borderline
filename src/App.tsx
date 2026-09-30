import { Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Home from './routes/Home';
import Play from './routes/Play';
import PuzzlePlay from './routes/PuzzlePlay';
import DailyPlay from './routes/DailyPlay';
import Results from './routes/Results';
import About from './routes/About';
import AuthCallback from './routes/AuthCallback';
import QaDashboard from './routes/qa/QaDashboard';
import QaRenderSingle from './routes/qa/QaRenderSingle';
import QaRenderBatch from './routes/qa/QaRenderBatch';
import QaNeighborAudit from './routes/qa/QaNeighborAudit';
import QaPuzzleBrowser from './routes/qa/QaPuzzleBrowser';
import QaPuzzlePreview from './routes/qa/QaPuzzlePreview';
import QaDistribution from './routes/qa/QaDistribution';
import QaCalendar from './routes/qa/QaCalendar';
import { useAuth } from './context/AuthContext';
import StreakBadge from './components/StreakBadge';
import DailyCalendar from './components/DailyCalendar';
// LandMark routes
import LandMarkHome from './routes/landmark/Home';
import WhereIsIt from './routes/landmark/WhereIsIt';
import LandMarkResults from './routes/landmark/Results';
import MatchTheMap from './routes/landmark/MatchTheMap';
import WhatsBetween from './routes/landmark/WhatsBetween';
import PutThemInOrder from './routes/landmark/PutThemInOrder';
import ConnectTheDots from './routes/landmark/ConnectTheDots';
import WhichOneDoesntBelong from './routes/landmark/WhichOneDoesntBelong';
import BuildTheMap from './routes/landmark/BuildTheMap';
import ZoomIn from './routes/landmark/ZoomIn';

function AuthButton() {
  const { user, signInWithGoogle, signOut } = useAuth()

  if (user) {
    const avatar = user.user_metadata?.avatar_url as string | undefined
    const name = (user.user_metadata?.full_name ?? user.email ?? '') as string
    return (
      <div className='auth-user'>
        {avatar && <img src={avatar} alt={name} className='auth-avatar' />}
        <span className='auth-name'>{name.split(' ')[0]}</span>
        <button className='auth-signout' onClick={signOut}>Sign out</button>
      </div>
    )
  }

  return (
    <button className='auth-signin' onClick={signInWithGoogle}>Sign in</button>
  )
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeDateParam = searchParams.get('date');

  return (
    <div className='app-wrap'>
      <header className='app-header'>
        <Link to='/' className='brand'>Borderline</Link>
        <nav>
          <Link to='/daily'>Daily</Link>
          <Link to='/'>Play</Link>
          <Link to='/landmark'>LandMark</Link>
          <Link to='/about'>About</Link>
        </nav>
        {user && (
          <div className="header-stats">
            <StreakBadge />
            <DailyCalendar
              onDateSelect={(date) => navigate(`/daily?date=${date}`)}
              selectedDate={activeDateParam ?? todayString()}
              historyWindowDays={60}
            />
          </div>
        )}
        <AuthButton />
      </header>
      <main>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/play' element={<Play />} />
          <Route path='/results' element={<Results />} />
          <Route path='/puzzle' element={<PuzzlePlay />} />
          <Route path='/daily' element={<DailyPlay />} />
          <Route path='/about' element={<About />} />
          <Route path='/auth/callback' element={<AuthCallback />} />
          <Route path='/qa' element={<QaDashboard />} />
          <Route path='/qa/render' element={<QaRenderSingle />} />
          <Route path='/qa/render-all' element={<QaRenderBatch />} />
          <Route path='/qa/neighbors' element={<QaNeighborAudit />} />
          <Route path='/qa/puzzles' element={<QaPuzzleBrowser />} />
          <Route path='/qa/puzzles/:region/:id' element={<QaPuzzlePreview />} />
          <Route path='/qa/distribution' element={<QaDistribution />} />
          <Route path='/qa/calendar' element={<QaCalendar />} />
          {/* LandMark routes */}
          <Route path='/landmark' element={<LandMarkHome />} />
          <Route path='/landmark/games/where-is-it' element={<WhereIsIt />} />
          <Route path='/landmark/games/match-the-map' element={<MatchTheMap />} />
          <Route path='/landmark/games/whats-between' element={<WhatsBetween />} />
          <Route path='/landmark/games/put-them-in-order' element={<PutThemInOrder />} />
          <Route path='/landmark/games/connect-the-dots' element={<ConnectTheDots />} />
          <Route path='/landmark/games/which-doesnt-belong' element={<WhichOneDoesntBelong />} />
          <Route path='/landmark/games/build-the-map' element={<BuildTheMap />} />
          <Route path='/landmark/games/zoom-in' element={<ZoomIn />} />
          <Route path='/landmark/results' element={<LandMarkResults />} />
        </Routes>
      </main>
    </div>
  );
}
