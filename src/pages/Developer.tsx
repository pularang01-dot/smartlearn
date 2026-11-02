import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { developer as d } from '../lib/developer';

const TODO = (t: string) => <span className="todo">[{t}]</span>;

export default function Developer() {
  const initials = d.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
  return (
    <section>
      <div className="card devhero">
        <div className="avatar">{d.photoUrl ? <img src={d.photoUrl} alt={`Foto ${d.name}`} /> : initials}</div>
        <div className="grow">
          <h1>{d.name}</h1>
          <p style={{ fontSize: '1.15rem', margin: 0 }}>{d.role || TODO('Peran/jabatan — isi di src/lib/developer.ts')}</p>
          <p className="muted" style={{ maxWidth: '60ch' }}>{d.bio || TODO('Ringkasan singkat pengembang — isi di src/lib/developer.ts')}</p>
          <div className="row">
            <Link className="btn" to="/play"><Icon name="play" /> Coba aplikasi</Link>
            {d.email ? <a className="btn alt" href={`mailto:${d.email}`}><Icon name="mail" /> Kirim masukan</a> : <span className="chip amber">Email belum diisi</span>}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        <article className="card">
          <h2>Tentang SmartLearn Motion</h2>
          <p>Media pembelajaran interaktif untuk kelas: siswa menjawab kuis dengan berdiri di zona pilihan di depan kamera, sehingga belajar sambil bergerak. Guru membuat kuis sendiri, tanpa akun.</p>
          <ul>
            <li>Dirancang untuk Smartboard dan proyektor kelas.</li>
            <li>Berjalan di perangkat sendiri; data kuis dan hasil tersimpan lokal.</li>
            <li>Tersedia juga mode sentuh dan keyboard sebagai cadangan.</li>
          </ul>
        </article>
        <article className="card">
          <h2>Privasi & Keamanan</h2>
          <ul>
            <li>Video diproses di memori perangkat; tidak direkam dan tidak diunggah.</li>
            <li>Tidak ada pengenalan wajah dan tidak ada identitas siswa yang dikumpulkan.</li>
            <li>Ekspor dan impor data sepenuhnya dalam kendali guru.</li>
          </ul>
        </article>
        <article className="card">
          <h2>Teknologi</h2>
          <div className="chips">{['React', 'TypeScript', 'Vite', 'IndexedDB (Dexie)', 'MediaPipe Pose', 'Zod'].map((t) => <span className="chip" key={t}>{t}</span>)}</div>
          <h3 style={{ marginTop: 20 }}>Kredit & lisensi</h3>
          <p className="muted" style={{ margin: 0 }}>Deteksi pose menggunakan MediaPipe dari Google (Apache-2.0). Font Plus Jakarta Sans dan Inter (SIL OFL) dari Google Fonts. Periksa lisensi masing-masing sebelum mendistribusikan ulang.</p>
        </article>
        <article className="card">
          <h2>Hubungi & Masukan</h2>
          {d.links.length ? <ul>{d.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label} <Icon name="ext" size={14} /></a></li>)}</ul>
            : <p>{TODO('Tautan portofolio/media sosial — isi di src/lib/developer.ts')}</p>}
          <p className="muted">Menemukan masalah atau punya ide? Sertakan langkah yang dilakukan dan jenis perangkat/browser yang dipakai.</p>
        </article>
      </div>
      <p className="muted">Versi aplikasi v{d.version} · © {d.year} {d.name}</p>
    </section>
  );
}
