import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Icon } from '../components/Icon';
import { loadSampleQuiz } from '../lib/sample';
import { averageAccuracy, sessionAccuracy } from '../lib/stats';
import { modelAvailable } from '../engine/camera/pose';

const SHORTCUTS: Record<string, string> = { '1': '/play', '2': '/studio/new', '3': '/studio', '4': '/calibrate', '5': '/results' };

export default function Dashboard() {
  const nav = useNavigate();
  const quizCount = useLiveQuery(() => db.quizzes.count(), []);
  const sessions = useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray(), []) ?? [];
  const [model, setModel] = useState<boolean | null>(null);
  const [calibrated, setCalibrated] = useState<boolean | null>(null);
  const [usage, setUsage] = useState('');

  useEffect(() => {
    modelAvailable().then(setModel);
    db.kv.get('calibration').then((r) => setCalibrated(!!r));
    navigator.storage?.estimate?.().then((e) => setUsage(`${((e.usage ?? 0) / 1048576).toFixed(1)} MB`));
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (SHORTCUTS[e.key]) nav(SHORTCUTS[e.key]);
    };
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, [nav]);

  const avg = averageAccuracy(sessions);
  return (
    <section>
      <div className="card hero">
        <div>
          <h1>Selamat datang, Bapak/Ibu Guru!</h1>
          <p>Kuis interaktif berbasis gerak tubuh: siswa menjawab dengan berdiri di zona pilihan di depan kamera. Buat kuis, kalibrasi kamera, lalu mulai bermain.</p>
        </div>
        <div className="row">
          <button className="btn alt" onClick={async () => nav(`/studio/${await loadSampleQuiz()}`)}><Icon name="spark" /> Muat kuis contoh</button>
          <Link className="btn xl" to="/play"><Icon name="play" /> Proyeksikan layar</Link>
        </div>
      </div>

      <div className="card privacy">
        <div className="row">
          <span className="iconbox"><Icon name="shield" size={26} /></span>
          <div>
            <strong>Privasi siswa dijaga</strong>
            <div className="muted">Video diproses di perangkat ini; tidak direkam dan tidak diunggah. Tidak ada pengenalan wajah.</div>
          </div>
        </div>
        <div className="stat">
          <div><small>Model pose</small><b>{model === null ? 'Memeriksa…' : model ? 'Siap' : 'Belum diunduh'}</b></div>
          <div><small>Penyimpanan lokal</small><b>{usage || '—'}</b></div>
        </div>
      </div>

      <div className="row sb"><h2>Menu cepat</h2><small className="muted">Pintasan keyboard: tekan 1–5</small></div>
      <div className="actions">
        <Link className="action main" to="/play">
          <div className="top-r"><span className="iconbox"><Icon name="play" size={26} /></span><span className="chip">Layar utama</span></div>
          <h3>Mulai Permainan</h3><p>Buka arena kuis untuk proyektor atau smartboard.</p>
        </Link>
        <Link className="action" to="/studio/new">
          <div className="top-r"><span className="iconbox"><Icon name="plus" size={26} /></span></div>
          <h3>Buat Kuis Baru</h3><p>Rancang soal Benar/Salah, pilihan ganda, atau bergambar.</p>
        </Link>
        <Link className="action" to="/studio">
          <div className="top-r"><span className="iconbox sec"><Icon name="folder" size={26} /></span><span className="chip sec">{quizCount ?? 0} kuis</span></div>
          <h3>Bank Kuis</h3><p>Kelola, duplikat, dan ekspor kuis Anda.</p>
        </Link>
        <Link className="action" to="/calibrate">
          <div className="top-r"><span className="iconbox amber"><Icon name="sliders" size={26} /></span>
            {calibrated !== null && <span className={'chip ' + (calibrated ? 'ok' : 'amber')}>{calibrated ? '✔ Sudah dikalibrasi' : 'Belum dikalibrasi'}</span>}</div>
          <h3>Kalibrasi Kamera</h3><p>Atur zona kiri–kanan, area netral, dan kepekaan deteksi.</p>
        </Link>
        <Link className="action wide" to="/results">
          <div className="top-r"><span className="iconbox amber"><Icon name="chart" size={26} /></span>
            <span className="chip plain">{avg === null ? 'Belum ada sesi' : `Rata-rata ketepatan ${avg}%`}</span></div>
          <h3>Hasil Belajar</h3><p>Tinjau jawaban per soal dan unduh laporan CSV/JSON.</p>
        </Link>
      </div>

      {quizCount === 0 && (
        <div className="card soon"><h3>Belum ada kuis</h3><p className="muted">Buat kuis sendiri, atau muat satu kuis contoh untuk mencoba alurnya.</p></div>
      )}

      <div className="two" style={{ marginTop: 24 }}>
        <div>
          <div className="row sb"><h2>Sesi terakhir</h2><Link to="/results">Lihat semua ({sessions.length})</Link></div>
          {!sessions.length && <p className="muted">Belum ada sesi permainan. Hasil akan muncul di sini setelah kuis dimainkan.</p>}
          {sessions.slice(0, 5).map((s) => {
            const acc = sessionAccuracy(s);
            return (
              <div className="sess" key={s.id}>
                <span className="iconbox"><Icon name="chart" /></span>
                <div className="grow"><strong>{s.quizTitle}</strong>
                  <div className="muted">{new Date(s.startedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {s.players.length} tim/pemain · {s.mode === 'camera' ? 'Kamera' : 'Sentuh'}</div></div>
                <div className="pct" style={{ color: acc !== null && acc >= 75 ? 'var(--ok)' : 'var(--amber-fg)' }}>{acc === null ? '—' : `${acc}%`}<small>ketepatan</small></div>
                <Link className="btn alt sm" to="/results" aria-label="Lihat hasil"><Icon name="eye" size={18} /></Link>
              </div>
            );
          })}
        </div>
        <aside className="card">
          <h3>Panduan cepat kelas</h3>
          <ol className="steps">
            <li><span>Pastikan pencahayaan ruangan merata dan tubuh siswa terlihat dari bahu hingga pinggul.</span></li>
            <li><span>Bagi siswa ke dalam tim yang bergiliran menjawab.</span></li>
            <li><span>Minta siswa berdiri di zona pilihan; jawaban dinilai saat waktu habis.</span></li>
          </ol>
          <div className="row sb" style={{ marginTop: 16 }}><span className="muted">Butuh bantuan?</span><Link to="/bantuan">Buka Bantuan</Link></div>
        </aside>
      </div>
    </section>
  );
}
