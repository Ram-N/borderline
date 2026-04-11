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
