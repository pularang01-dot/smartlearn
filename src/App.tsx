import { useEffect, useState } from 'react';
import { HashRouter, Link, NavLink, Route, Routes } from 'react-router-dom';
import { Icon, Logo, type IconName } from './components/Icon';
import { toggleTheme } from './lib/theme';
import { developer } from './lib/developer';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import QuizEditor from './pages/QuizEditor';
import Play from './pages/Play';
import Calibrate from './pages/Calibrate';
import Results from './pages/Results';
import Backup from './pages/Backup';
import Settings from './pages/Settings';
import Developer from './pages/Developer';
import Help from './pages/Help';

const NAV: [string, string, IconName][] = [
  ['/', 'Beranda', 'home'], ['/studio', 'Kuis', 'folder'], ['/play', 'Main', 'play'], ['/calibrate', 'Kamera', 'camera'], ['/results', 'Hasil', 'chart'],
];

function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    addEventListener('online', a); addEventListener('offline', b);
    return () => { removeEventListener('online', a); removeEventListener('offline', b); };
  }, []);
  return on;
}

export default function App() {
  const online = useOnline();
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  return (
    <HashRouter>
      <header className="top">
        <NavLink to="/" className="brand"><Logo /> SmartLearn Motion</NavLink>
        <nav className="links" aria-label="Navigasi utama">
          {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
        </nav>
        <span className="pill priv"><Icon name="camera" size={16} /> Video diproses di perangkat ini, tidak direkam dan tidak diunggah</span>
        <span className="pill out" role="status"><i className={'dot-s' + (online ? ' on' : '')} />{online ? 'Online' : 'Offline · data tersimpan lokal'}</span>
        <button className="btn alt sm" aria-label={dark ? 'Pakai tema terang' : 'Pakai tema gelap'} onClick={() => setDark(toggleTheme() === 'dark')}>
          <Icon name={dark ? 'sun' : 'moon'} size={18} />
        </button>
        <Link className="btn sm" to="/play"><Icon name="play" size={18} /> Mulai Permainan</Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/:id" element={<QuizEditor />} />
          <Route path="/play" element={<Play />} />
          <Route path="/calibrate" element={<Calibrate />} />
          <Route path="/results" element={<Results />} />
          <Route path="/backup" element={<Backup />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pengembang" element={<Developer />} />
          <Route path="/bantuan" element={<Help />} />
          <Route path="*" element={<p>Halaman tidak ditemukan.</p>} />
        </Routes>
      </main>
      <footer className="foot">
        <span>© {developer.year} SmartLearn Motion v{developer.version} · Dibuat oleh <Link to="/pengembang">{developer.name}</Link></span>
        <nav aria-label="Tautan footer"><Link to="/bantuan">Bantuan</Link><Link to="/backup">Backup</Link><Link to="/settings">Pengaturan</Link><Link to="/pengembang">Pengembang</Link></nav>
        <span>Data tersimpan di perangkat ini</span>
      </footer>
      <nav className="bottom" aria-label="Navigasi bawah">
        {NAV.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === '/'}><Icon name={icon} />{label}</NavLink>)}
      </nav>
    </HashRouter>
  );
}