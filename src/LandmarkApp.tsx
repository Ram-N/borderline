import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LandMarkHome from './routes/landmark/Home';
import PinPoint from './routes/landmark/PinPoint';
import WhereIsRegion from './routes/landmark/WhereIsRegion';
import LandMarkResults from './routes/landmark/Results';
import MatchTheMap from './routes/landmark/MatchTheMap';
import WhatsBetween from './routes/landmark/WhatsBetween';
import PutThemInOrder from './routes/landmark/PutThemInOrder';
import ConnectTheDots from './routes/landmark/ConnectTheDots';
import WhichOneDoesntBelong from './routes/landmark/WhichOneDoesntBelong';
import BuildTheMap from './routes/landmark/BuildTheMap';
import ZoomIn from './routes/landmark/ZoomIn';
import DailyLandmarkSelect from './routes/landmark/DailyLandmarkSelect';

export default function LandmarkApp() {
  const { pathname } = useLocation();
  // Game and daily pages hold in-progress state that is lost on navigation
  const inGame = pathname.startsWith('/landmark/games/') || pathname === '/landmark/daily';

  return (
    <div className='app-wrap'>
      <header className='app-header'>
        <Link
          to='/landmark'
          className='brand'
          onClick={(e) => {
            if (inGame && !window.confirm('Leave this game? Your progress will be lost.')) e.preventDefault();
          }}
        >
          LandMark
        </Link>
      </header>
      <main>
        <Routes>
          {/* Redirect root to /landmark so internal navigation paths are unchanged */}
          <Route path='/' element={<Navigate to='/landmark' replace />} />
          <Route path='/landmark' element={<LandMarkHome />} />
          <Route path='/landmark/games/pinpoint' element={<PinPoint />} />
          <Route path='/landmark/games/where-is-region' element={<WhereIsRegion />} />
          <Route path='/landmark/games/match-the-map' element={<MatchTheMap />} />
          <Route path='/landmark/games/whats-between' element={<WhatsBetween />} />
          <Route path='/landmark/games/put-them-in-order' element={<PutThemInOrder />} />
          <Route path='/landmark/games/connect-the-dots' element={<ConnectTheDots />} />
          <Route path='/landmark/games/which-doesnt-belong' element={<WhichOneDoesntBelong />} />
          <Route path='/landmark/games/build-the-map' element={<BuildTheMap />} />
          <Route path='/landmark/games/zoom-in' element={<ZoomIn />} />
          <Route path='/landmark/daily' element={<DailyLandmarkSelect />} />
          <Route path='/landmark/results' element={<LandMarkResults />} />
        </Routes>
      </main>
    </div>
  );
}
