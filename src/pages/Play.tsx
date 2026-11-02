import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, uid } from '../db';
import type { Question, Quiz, Session } from '../types';
import { currentPlayer, initGame, reduce, totals } from '../engine/game';
import { prepareQuestions } from '../engine/shuffle';
import { Ema, zoneAt, type TrackStatus } from '../engine/camera/zones';
import { modelAvailable } from '../engine/camera/pose';
import { TRACKER_TEXT, useCameraTracker } from '../engine/camera/useTracker';
import { defaultCfg, loadCfg, type CalibrationCfg } from '../lib/calibration';
import { validateForPlay } from '../lib/validate';
import { DIFFICULTY } from '../lib/format';
import { AssetImg } from '../components/AssetImg';
import { CameraStage, type ZoneResult } from '../components/CameraStage';
import { Icon } from '../components/Icon';
import { TimerRing } from '../components/TimerRing';

type Run = { quiz: Quiz; questions: Question[]; players: string[]; mode: 'camera' | 'touch'; seed: number };

export default function Play() {
  const [params] = useSearchParams();
  const quizzes = useLiveQuery(() => db.quizzes.filter((q) => !q.archived).toArray(), []) ?? [];
  const [quizId, setQuizId] = useState(params.get('quiz') ?? '');
  const [players, setPlayers] = useState('Tim A, Tim B');
  const [mode, setMode] = useState<'camera' | 'touch'>('touch');
  const [shuffle, setShuffle] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const [model, setModel] = useState<boolean | null>(null);
  const [calibrated, setCalibrated] = useState<boolean | null>(null);
  useEffect(() => { modelAvailable().then(setModel); db.kv.get('calibration').then((r) => setCalibrated(!!r)); }, []);

  async function start() {
    const quiz = await db.quizzes.get(quizId);
    if (!quiz) return setErrors(['Pilih kuis terlebih dahulu.']);
    const qs = await db.questions.where('quizId').equals(quizId).sortBy('order');
    const errs = validateForPlay(qs);
    if (errs.length) return setErrors(errs);
    const seed = Date.now();
    const names = players.split(',').map((p) => p.trim()).filter(Boolean);
    setErrors([]);
    setRun({ quiz, questions: prepareQuestions(qs, shuffle, seed), players: names.length ? names : ['Pemain'], mode, seed });
  }

  if (run) return <Arena run={run} onExit={() => setRun(null)} />;
  return (
    <section>
      <h1>Mulai Permainan</h1>
      {errors.length > 0 && <div role="alert" className="alert">{errors.map((e) => <div key={e}>{e}</div>)}</div>}
      <div className="card form" style={{ maxWidth: 760 }}>
        <label>Kuis<select value={quizId} onChange={(e) => setQuizId(e.target.value)}>
          <option value="">— pilih kuis —</option>{quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}</select></label>
        <label>Pemain/tim yang bergiliran (pisahkan koma; cukup nama panggilan)<input value={players} onChange={(e) => setPlayers(e.target.value)} /></label>
        <label>Metode jawab<select value={mode} onChange={(e) => setMode(e.target.value as 'camera' | 'touch')}>
          <option value="touch">Sentuh / keyboard</option><option value="camera">Kamera (posisi tubuh), cadangan sentuh/keyboard</option></select></label>
        <label className="row"><input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} /> Acak urutan soal & opsi</label>
        {mode === 'camera' && (
          <div className="row" role="status">
            <span className={'pill ' + (model ? 'ok' : 'amber')}>{model === null ? 'Memeriksa model…' : model ? '✔ Model pose siap' : 'Model pose belum diunduh'}</span>
            <span className={'pill ' + (calibrated ? 'ok' : 'amber')}>{calibrated ? '✔ Kamera sudah dikalibrasi' : 'Belum dikalibrasi'}</span>
          </div>
        )}
        {mode === 'camera' && <p className="muted">Zona mengikuti jumlah opsi (2–4). Soal dengan lebih dari 4 opsi memakai sentuh/keyboard. Jawaban dinilai saat waktu habis.</p>}
        <button className="btn xl" onClick={start}><Icon name="play" /> Mulai</button>
      </div>
    </section>
  );
}

function Arena({ run, onExit }: { run: Run; onExit: () => void }) {
  const nav = useNavigate();
  const [s, dispatch] = useReducer(reduce, undefined, () => initGame(run.questions, run.players));
  const [cfg, setCfg] = useState<CalibrationCfg>(defaultCfg);
  const [cam, setCam] = useState<{ status: TrackStatus; zone: number | null }>({ status: 'unstable', zone: null });
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  const startedAt = useRef(Date.now());
  const saved = useRef(false);
  const ema = useRef(new Ema(0.4));
  const root = useRef<HTMLDivElement>(null);
  const q = s.questions[s.index];
  const camUsable = run.mode === 'camera' && s.phase !== 'completed' && q.options.length >= 2 && q.options.length <= 4;

  useEffect(() => { loadCfg().then(setCfg); dispatch({ type: 'START' }); }, []);

  const ticking = s.phase === 'countdown' || s.phase === 'questionActive';
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  useEffect(() => { if (s.phase === 'questionActive') ema.current.reset(); }, [s.index, s.phase]);

  const tracker = useCameraTracker({
    enabled: run.mode === 'camera' && s.phase !== 'completed', deviceId: cfg.deviceId, minVis: cfg.minVis,
    onFrame: (p) => {
      if (!camUsable || s.phase !== 'questionActive') return;
      if (!p) { setPt(null); setCam({ status: 'unstable', zone: null }); return; }
      const x = ema.current.push(p.x);
      setPt({ x, y: p.y });
      const zone = zoneAt(x, { count: q.options.length, gap: cfg.gap, mirror: cfg.mirror });
      setCam({ status: 'tracking', zone });
      // Di zona = pilihan sementara. Di area netral / tubuh hilang = pilihan terakhir dipertahankan. Dinilai saat waktu habis.
      if (zone !== null && s.selected?.optionId !== q.options[zone].id) dispatch({ type: 'SELECT', optionId: q.options[zone].id, method: 'camera' });
    },
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) dispatch({ type: 'SELECT', optionId: q.options[n - 1].id, method: 'keyboard' });
      else if (e.key === ' ') { e.preventDefault(); dispatch({ type: s.phase === 'paused' ? 'RESUME' : 'PAUSE' }); }
      else if (e.key === 'Enter') dispatch({ type: 'NEXT' });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [q, s.phase]);

  useEffect(() => {
    if (s.phase !== 'completed' || saved.current) return;
    saved.current = true;
    const session: Session = {
      id: uid(), quizId: run.quiz.id, quizTitle: run.quiz.title, startedAt: startedAt.current, finishedAt: Date.now(),
      mode: run.mode, players: run.players, seed: run.seed,
      questions: s.questions.map((x) => ({ id: x.id, prompt: x.prompt, explanation: x.explanation })), answers: s.answers,
    };
    db.sessions.add(session).catch(() => alert('Gagal menyimpan hasil (penyimpanan penuh?).'));
  }, [s.phase]);

  const last = s.answers[s.answers.length - 1];
  const t = totals(s);

  if (s.phase === 'completed') {
    return (
      <div className="arena">
        <div className="qbox"><h1>🏁 Permainan selesai</h1>
          <p>{s.answers.filter((a) => a.correct).length} dari {s.answers.length} jawaban benar. Hasil tersimpan di perangkat ini.</p></div>
        <ul className="score">{s.players.map((p, i) => <li key={p}>{p}<b>{t[i]} poin</b></li>)}</ul>
        <div className="row"><button className="btn xl" onClick={() => nav('/results')}><Icon name="chart" /> Lihat hasil</button><button className="btn xl alt" onClick={onExit}>Main lagi</button></div>
      </div>
    );
  }

  const inQ = s.phase === 'questionActive' || s.phase === 'feedback';
  const fb = s.phase === 'feedback';
  const selIdx = s.selected ? q.options.findIndex((o) => o.id === s.selected!.optionId) : -1;
  const results: ZoneResult[] | undefined = fb && camUsable ? q.options.map((o) => (o.id === q.correctOptionId ? 'right' : 'wrong')) : undefined;
  const who = s.players[currentPlayer(s)];
  const camText = tracker.status === 'running' && camUsable
    ? cam.status === 'unstable' ? 'Tubuh tidak terlihat penuh' : cam.zone !== null ? `Terdeteksi di zona ${cam.zone + 1} (${String.fromCharCode(65 + cam.zone)})` : 'Di area netral (pilihan terakhir tetap berlaku)'
    : tracker.status === 'running' ? 'Soal ini memakai sentuh/keyboard' : TRACKER_TEXT[tracker.status];
  const statusLine = s.phase === 'questionActive' ? 'Boleh berpindah pilihan. Jawaban dinilai saat waktu habis.' : fb ? 'Waktu habis, jawaban sudah dinilai.' : '';

  return (
    <div className="arena" ref={root}>
      <header className="abar">
        <span className="pill big"><Icon name="list" size={18} /> Soal {s.index + 1} / {s.questions.length}</span>
        <div className="turn"><small>Giliran bermain</small><b>{who} <span className="chip">{t[currentPlayer(s)]} poin</span></b></div>
        <div className="timerbox">
          <TimerRing remaining={s.remaining} total={s.phase === 'countdown' ? 3 : q.timeLimitSeconds} label={s.phase === 'countdown' ? '…' : undefined} />
          <div><b>Batas waktu</b><small>Jawaban dinilai saat hitungan 0</small></div>
        </div>
        <div className="abtns">
          {s.phase === 'questionActive' && <button className="btn alt" onClick={() => dispatch({ type: 'FINISH' })}><Icon name="skip" size={18} /> Selesaikan</button>}
          <button className="btn alt" onClick={() => dispatch({ type: s.phase === 'paused' ? 'RESUME' : 'PAUSE' })}><Icon name={s.phase === 'paused' ? 'play' : 'pause'} size={18} /> {s.phase === 'paused' ? 'Lanjut' : 'Jeda'}</button>
          <button className="btn alt" aria-label="Layar penuh" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen())}><Icon name="expand" size={18} /></button>
          <button className="btn danger" onClick={() => confirm('Akhiri permainan? Hasil tidak disimpan.') && onExit()}><Icon name="x" size={18} /> Akhiri</button>
        </div>
      </header>

      {s.phase === 'countdown' && <div className="countdown" aria-live="assertive">{s.remaining}</div>}
      {s.phase === 'paused' && <div className="countdown">⏸ Dijeda</div>}

      {inQ && (
        <div className="qbox">
          <div className="chips" style={{ justifyContent: 'center' }}>
            {run.quiz.subject && <span className="chip sec">{run.quiz.subject}</span>}
            {run.quiz.grade && <span className="chip plain">{run.quiz.grade}</span>}
            <span className="chip amber">{DIFFICULTY[run.quiz.difficulty]}</span>
          </div>
          <h1 className="prompt">{q.prompt}</h1>
          {q.instructions && <p>{q.instructions}</p>}
          <AssetImg id={q.imageAssetId} alt="Gambar soal" />
        </div>
      )}

      {run.mode === 'camera' && (
        <CameraStage big videoRef={tracker.videoRef} cfg={cfg} count={camUsable ? q.options.length : 0}
          point={pt} zone={selIdx >= 0 ? selIdx : null} selectedBadge="Terpilih"
          labels={q.options.map((o) => o.text)} results={results}
          onPick={s.phase === 'questionActive' && camUsable ? (i) => dispatch({ type: 'SELECT', optionId: q.options[i].id, method: 'touch' }) : undefined} />
      )}

      {inQ && !camUsable && (
        <div className="options" style={{ gridTemplateColumns: `repeat(${Math.min(q.options.length, 3)}, 1fr)` }}>
          {q.options.map((o, i) => {
            const isCorrect = o.id === q.correctOptionId;
            const chosen = last?.optionId === o.id;
            return (
              <button key={o.id} disabled={fb} className={'opt' + (fb && isCorrect ? ' right' : '') + (fb && chosen && !isCorrect ? ' wrong' : '') + (!fb && s.selected?.optionId === o.id ? ' target' : '')}
                onClick={() => dispatch({ type: 'SELECT', optionId: o.id, method: 'touch' })}>
                <kbd>{String.fromCharCode(65 + i)}</kbd> {o.text}
                {fb && isCorrect && <em> ✔ Benar</em>}{fb && chosen && !isCorrect && <em> ✘ Salah</em>}
              </button>
            );
          })}
        </div>
      )}

      <div className="astatus" aria-live="polite">
        <span><Icon name="info" size={18} /> <b>{run.mode === 'camera' ? camText : 'Pilih jawaban dengan sentuh atau tombol 1–' + q.options.length}</b>{statusLine && <span className="muted"> · {statusLine}</span>}</span>
        {run.mode === 'camera' && <span className="pill ok"><Icon name="lock" size={16} /> Kamera lokal, tidak direkam & tidak diunggah</span>}
      </div>
      {run.mode === 'camera' && tracker.message && <p className="muted"><small>{tracker.message}</small></p>}

      {fb && (
        <div className="card">
          <h3>{last.optionId === null ? '⌛ Waktu habis, belum ada pilihan' : last.correct ? `✔ Benar! +${last.points} poin` : '✘ Belum tepat'}</h3>
          {q.explanation && <p>{q.explanation}</p>}
          <button className="btn xl" onClick={() => dispatch({ type: 'NEXT' })}>{s.index + 1 >= s.questions.length ? 'Selesai' : 'Soal berikutnya'}</button>
        </div>
      )}
      <p className="muted"><small>Keyboard: 1–{q.options.length} pilih · Spasi jeda · Enter lanjut</small></p>
    </div>
  );
}
