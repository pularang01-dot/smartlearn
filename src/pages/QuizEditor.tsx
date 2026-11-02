import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, uid } from '../db';
import { ALLOWED_IMAGE, MAX_IMAGE_BYTES, QuizSchema, type Question, type Quiz } from '../types';
import { questionError } from '../lib/validate';
import { AssetImg } from '../components/AssetImg';
import { ZonePreview } from '../components/ZonePreview';

const TF = () => [{ id: 't', text: 'Benar' }, { id: 'f', text: 'Salah' }];
const MC = () => [1, 2, 3, 4].map((n) => ({ id: uid(), text: `Opsi ${n}` }));

const newQuestion = (quizId: string, order: number, type: Question['type'] = 'multiple_choice'): Question => {
  const options = type === 'true_false' ? TF() : MC();
  return { id: uid(), quizId, order, type, prompt: '', instructions: '', imageAssetId: null, options, correctOptionId: options[0].id, explanation: '', points: 10, timeLimitSeconds: 20, schemaVersion: 1 };
};

export default function QuizEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [qs, setQs] = useState<Question[]>([]);
  const [dirty, setDirty] = useState(false);
  const [msgs, setMsgs] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (id === 'new') {
        const now = Date.now();
        setQuiz({ id: uid(), title: '', description: '', subject: '', grade: '', difficulty: 'medium', tags: [], archived: false, createdAt: now, updatedAt: now, schemaVersion: 1 });
        setDirty(true);
      } else {
        const z = await db.quizzes.get(id!);
        if (!z) return setMsgs(['Kuis tidak ditemukan.']);
        setQuiz(z); setQs(await db.questions.where('quizId').equals(z.id).sortBy('order'));
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!quiz) return <p>{msgs[0] ?? 'Memuat…'}</p>;
  const setQuizF = (p: Partial<Quiz>) => { setQuiz({ ...quiz, ...p }); setDirty(true); };
  const setQ = (i: number, p: Partial<Question>) => { setQs(qs.map((x, j) => (j === i ? { ...x, ...p } : x))); setDirty(true); };
  const move = (i: number, d: number) => {
    const a = [...qs]; const j = i + d; if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setQs(a); setDirty(true);
  };

  async function upload(i: number, file?: File) {
    if (!file) return;
    if (!ALLOWED_IMAGE.includes(file.type)) return setMsgs(['Tipe gambar harus PNG/JPEG/WEBP/GIF.']);
    if (file.size > MAX_IMAGE_BYTES) return setMsgs(['Ukuran gambar maksimal 2 MB.']);
    try {
      const aid = uid(); await db.assets.add({ id: aid, name: file.name, mime: file.type, blob: file });
      setQ(i, { imageAssetId: aid }); setMsgs([]);
    } catch { setMsgs(['Penyimpanan penuh atau gagal menyimpan gambar. Ekspor backup lalu hapus data lama.']); }
  }

  async function save() {
    const parsed = QuizSchema.safeParse({ ...quiz, updatedAt: Date.now() });
    const errs: string[] = parsed.success ? [] : parsed.error.issues.map((x) => x.message);
    const ordered = qs.map((x, i) => ({ ...x, order: i, quizId: quiz!.id }));
    ordered.forEach((x, i) => { const e = questionError(x); if (e) errs.push(`Soal ${i + 1}: ${e}`); });
    setMsgs(errs);
    if (errs.length || !parsed.success) return;
    try {
      await db.transaction('rw', db.quizzes, db.questions, async () => {
        await db.quizzes.put(parsed.data);
        await db.questions.where('quizId').equals(quiz!.id).delete();
        await db.questions.bulkPut(ordered);
      });
      setQs(ordered); setDirty(false);
      if (id === 'new') nav(`/studio/${quiz!.id}`, { replace: true });
    } catch { setMsgs(['Gagal menyimpan (penyimpanan penuh?). Ekspor backup lalu bebaskan ruang.']); }
  }

  return (
    <section>
      <h1>Editor Kuis {dirty ? <small className="warn">● belum tersimpan</small> : <small className="ok">✔ Tersimpan di perangkat ini</small>}</h1>
      {msgs.length > 0 && <div role="alert" className="alert">{msgs.map((m) => <div key={m}>{m}</div>)}</div>}
      <div className="card form">
        <label>Judul<input value={quiz.title} onChange={(e) => setQuizF({ title: e.target.value })} /></label>
        <label>Deskripsi<input value={quiz.description} onChange={(e) => setQuizF({ description: e.target.value })} /></label>
        <label>Mata pelajaran<input value={quiz.subject} onChange={(e) => setQuizF({ subject: e.target.value })} /></label>
        <label>Kelas / jenjang<input placeholder="mis. Kelas 5 SD" value={quiz.grade} onChange={(e) => setQuizF({ grade: e.target.value })} /></label>
        <label>Tingkat<select value={quiz.difficulty} onChange={(e) => setQuizF({ difficulty: e.target.value as Quiz['difficulty'] })}>
          <option value="easy">Mudah</option><option value="medium">Sedang</option><option value="hard">Sulit</option></select></label>
        <label>Tag (pisahkan koma)<input value={quiz.tags.join(', ')} onChange={(e) => setQuizF({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} /></label>
      </div>

      {qs.map((q, i) => (
        <div className="card form" key={q.id}>
          <div className="row"><strong>Soal {i + 1}</strong>
            <button className="btn alt" onClick={() => move(i, -1)} aria-label="Naikkan">↑</button>
            <button className="btn alt" onClick={() => move(i, 1)} aria-label="Turunkan">↓</button>
            <button className="btn alt" onClick={() => { setQs([...qs.slice(0, i + 1), { ...q, id: uid() }, ...qs.slice(i + 1)]); setDirty(true); }}>⧉ Duplikat</button>
            <button className="btn danger o" onClick={() => { if (confirm(`Hapus soal ${i + 1}?`)) { setQs(qs.filter((_, j) => j !== i)); setDirty(true); } }}>🗑 Hapus</button>
          </div>
          <label>Jenis<select value={q.type} onChange={(e) => {
            const type = e.target.value as Question['type']; const base = newQuestion(quiz.id, i, type);
            setQ(i, { type, options: base.options, correctOptionId: base.correctOptionId });
          }}>
            <option value="multiple_choice">Pilihan ganda</option><option value="true_false">Benar/Salah</option><option value="image">Berbasis gambar (pilihan ganda)</option>
          </select></label>
          <label>Pertanyaan<textarea value={q.prompt} onChange={(e) => setQ(i, { prompt: e.target.value })} /></label>
          {q.type === 'image' && (
            <div>
              <label>Gambar (PNG/JPEG/WEBP/GIF, maks 2 MB)<input type="file" accept={ALLOWED_IMAGE.join(',')} onChange={(e) => upload(i, e.target.files?.[0])} /></label>
              <AssetImg id={q.imageAssetId} alt="Gambar soal" />
            </div>
          )}
          <fieldset><legend>Opsi (pilih kunci jawaban)</legend>
            {q.options.map((o, k) => (
              <div className="row" key={o.id}>
                <input type="radio" name={`c${q.id}`} checked={q.correctOptionId === o.id} onChange={() => setQ(i, { correctOptionId: o.id })} aria-label={`Kunci: opsi ${k + 1}`} />
                <input value={o.text} disabled={q.type === 'true_false'} aria-label={`Opsi ${k + 1}`}
                  onChange={(e) => setQ(i, { options: q.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })} />
                {q.type !== 'true_false' && q.options.length > 2 && (
                  <button className="btn alt" onClick={() => {
                    const options = q.options.filter((x) => x.id !== o.id);
                    setQ(i, { options, correctOptionId: options.some((x) => x.id === q.correctOptionId) ? q.correctOptionId : options[0].id });
                  }}>✕</button>)}
              </div>
            ))}
            {q.type !== 'true_false' && q.options.length < 6 && <button className="btn alt" onClick={() => setQ(i, { options: [...q.options, { id: uid(), text: '' }] })}>+ Opsi</button>}
            {q.options.length > 4 && <p className="muted">Lebih dari 4 opsi: mode kamera tidak mendukung soal ini (otomatis memakai sentuh/keyboard).</p>}
          </fieldset>
          <div><strong>Pratinjau zona kamera</strong><ZonePreview q={q} /></div>
          <label>Pembahasan<textarea value={q.explanation} onChange={(e) => setQ(i, { explanation: e.target.value })} /></label>
          <div className="row">
            <label>Poin<input type="number" min={0} value={q.points} onChange={(e) => setQ(i, { points: +e.target.value })} /></label>
            <label>Waktu (detik)<input type="number" min={5} max={600} value={q.timeLimitSeconds} onChange={(e) => setQ(i, { timeLimitSeconds: +e.target.value })} /></label>
          </div>
        </div>
      ))}
      <div className="row">
        <button className="btn alt" onClick={() => { setQs([...qs, newQuestion(quiz.id, qs.length)]); setDirty(true); }}>➕ Tambah soal</button>
        <button className="btn" onClick={save}>💾 Simpan</button>
        <button className="btn alt" onClick={() => nav('/studio')}>Kembali</button>
      </div>
    </section>
  );
}
