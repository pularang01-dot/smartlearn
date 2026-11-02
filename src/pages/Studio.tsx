import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, uid } from '../db';
import type { Quiz } from '../types';
import { Icon } from '../components/Icon';
import { DIFFICULTY, relTime } from '../lib/format';
import { loadSampleQuiz } from '../lib/sample';

export default function Studio() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const quizzes = useLiveQuery(() => db.quizzes.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const counts = useLiveQuery(async () => {
    const m: Record<string, number> = {};
    (await db.questions.toArray()).forEach((x) => { m[x.quizId] = (m[x.quizId] ?? 0) + 1; });
    return m;
  }, []) ?? {};
  const sessionCount = useLiveQuery(() => db.sessions.count(), []) ?? 0;
  const subjects = [...new Set(quizzes.map((x) => x.subject).filter(Boolean))];
  const grades = [...new Set(quizzes.map((x) => x.grade).filter(Boolean))];
  const list = quizzes.filter((x) => (!subject || x.subject === subject) && (!grade || x.grade === grade) &&
    (x.title + x.tags.join(' ') + x.description).toLowerCase().includes(q.toLowerCase()));
  const totalQ = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

  async function duplicate(quiz: Quiz) {
    const id = uid(); const now = Date.now();
    const qs = await db.questions.where('quizId').equals(quiz.id).toArray();
    await db.transaction('rw', db.quizzes, db.questions, async () => {
      await db.quizzes.add({ ...quiz, id, title: quiz.title + ' (salinan)', createdAt: now, updatedAt: now });
      await db.questions.bulkAdd(qs.map((x) => ({ ...x, id: uid(), quizId: id })));
    });
  }
  async function remove(quiz: Quiz) {
    if (!confirm(`Hapus kuis "${quiz.title}" beserta soalnya? Tindakan ini tidak dapat dibatalkan.`)) return;
    await db.transaction('rw', db.quizzes, db.questions, async () => { await db.questions.where('quizId').equals(quiz.id).delete(); await db.quizzes.delete(quiz.id); });
  }

  return (
    <section>
      <div className="card row sb">
        <div><h1>Bank Kuis</h1><p className="muted" style={{ margin: 0 }}>Kelola paket pertanyaan. Data tersimpan di perangkat ini, tanpa koneksi internet.</p></div>
        <div className="row">
          <button className="btn alt" onClick={async () => nav(`/studio/${await loadSampleQuiz()}`)}><Icon name="spark" /> Muat kuis contoh</button>
          <Link className="btn alt" to="/backup"><Icon name="download" /> Impor kuis</Link>
          <Link className="btn" to="/studio/new"><Icon name="plus" /> Buat kuis baru</Link>
        </div>
      </div>

      <div className="stats">
        <div className="card flat"><span className="iconbox"><Icon name="folder" /></span><div><small>Total kuis</small><b>{quizzes.length}</b></div></div>
        <div className="card flat"><span className="iconbox sec"><Icon name="list" /></span><div><small>Rata-rata soal per kuis</small><b>{quizzes.length ? (totalQ / quizzes.length).toFixed(1) : '—'}</b></div></div>
        <div className="card flat"><span className="iconbox amber"><Icon name="chart" /></span><div><small>Sesi dimainkan</small><b>{sessionCount}</b></div></div>
        <div className="card flat"><span className="iconbox"><Icon name="lock" /></span><div><small>Penyimpanan</small><b>IndexedDB (lokal)</b></div></div>
      </div>

      <div className="card filters">
        <div className="grow" style={{ position: 'relative', minWidth: 220 }}>
          <input aria-label="Cari kuis" placeholder="Cari judul, topik, atau tag…" style={{ width: '100%', paddingLeft: 42 }} value={q} onChange={(e) => setQ(e.target.value)} />
          <span style={{ position: 'absolute', left: 12, top: 14, color: 'var(--muted)' }}><Icon name="search" size={20} /></span>
        </div>
        <div className="seg" role="group" aria-label="Filter mata pelajaran">
          <button className={!subject ? 'on' : ''} onClick={() => setSubject('')}>Semua</button>
          {subjects.map((s) => <button key={s} className={subject === s ? 'on' : ''} onClick={() => setSubject(s)}>{s}</button>)}
        </div>
        {grades.length > 0 && (
          <select aria-label="Filter kelas" value={grade} onChange={(e) => setGrade(e.target.value)}><option value="">Semua kelas</option>{grades.map((g) => <option key={g}>{g}</option>)}</select>
        )}
        <div className="seg" role="group" aria-label="Tampilan">
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="Tampilan kartu"><Icon name="grid" size={18} /></button>
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="Tampilan daftar"><Icon name="list" size={18} /></button>
        </div>
      </div>

      <div className="two">
        <div>
          {!list.length && <div className="card soon"><h3>Tidak ada kuis</h3><p className="muted">Buat kuis baru, muat kuis contoh, atau ubah filter pencarian.</p></div>}
          <div className={'qgrid ' + view}>
            {list.map((x) => (
              <article className="card qcard" key={x.id}>
                <div className="grow">
                  <div className="chips">
                    {x.subject && <span className="chip sec">{x.subject}{x.grade ? ` · ${x.grade}` : ''}</span>}
                    <span className={'chip ' + (x.difficulty === 'hard' ? 'bad' : x.difficulty === 'easy' ? 'ok' : 'amber')}>{DIFFICULTY[x.difficulty]}</span>
                    <span className="chip plain">{counts[x.id] ?? 0} soal</span>
                  </div>
                  <h3>{x.title}</h3>
                  {x.description && <p>{x.description}</p>}
                  <small className="muted">Diperbarui: {relTime(x.updatedAt)}</small>
                </div>
                <div className="row">
                  <Link className="btn sm alt" to={`/studio/${x.id}`}><Icon name="edit" size={18} /> Edit</Link>
                  <button className="btn sm alt" aria-label="Duplikat kuis" onClick={() => duplicate(x)}><Icon name="copy" size={18} /></button>
                  <button className="btn sm danger o" aria-label="Hapus kuis" onClick={() => remove(x)}><Icon name="trash" size={18} /></button>
                  <Link className="btn sm" to={`/play?quiz=${x.id}`}><Icon name="play" size={18} /> Mulai di Arena</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside>
          <div className="card hint"><h3>Aturan sensor gerak</h3><p style={{ margin: 0 }}>Kamera mendukung maksimal <b>4 opsi</b> per soal (zona A–D). Soal dengan opsi lebih banyak dijawab dengan sentuh/keyboard.</p></div>
          <div className="card soon">
            <div className="row sb"><h3>Editor Soal Cepat</h3><span className="chip amber">Segera hadir</span></div>
            <p className="muted" style={{ margin: 0 }}>Edit soal langsung dari panel ini. Untuk sekarang, gunakan tombol <b>Edit</b> pada kartu kuis.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
