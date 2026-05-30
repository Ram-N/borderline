import { Routes, Route, Link } from 'react-router-dom';
import Home from './routes/Home';
import Play from './routes/Play';
import PuzzlePlay from './routes/PuzzlePlay';
import DailyPlay from './routes/DailyPlay';
import Results from './routes/Results';
import About from './routes/About';
import AuthCallback from './routes/AuthCallback';
import { useAuth } from './context/AuthContext';
import StreakBadge from './components/StreakBadge';
import ScoreCalendar from './components/ScoreCalendar';

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

export default function App() {
  const { user } = useAuth();

  return (
    <div className='app-wrap'>
      <header className='app-header'>
        <Link to='/' className='brand'>Borderline</Link>
        <nav>
          <Link to='/daily'>Daily</Link>
          <Link to='/play'>Play</Link>
          <Link to='/results'>Results</Link>
          <Link to='/about'>About</Link>
        </nav>
        {user && (
          <div className="header-stats">
            <StreakBadge />
            <ScoreCalendar />
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
        </Routes>
      </main>
    </div>
  );
}
