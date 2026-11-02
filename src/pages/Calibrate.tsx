import { useEffect, useRef, useState } from 'react';
import { CameraStage } from '../components/CameraStage';
import { Icon } from '../components/Icon';
import { Ema, zoneAt, zoneCenterX } from '../engine/camera/zones';
import { TRACKER_TEXT, useCameraTracker } from '../engine/camera/useTracker';
import { defaultCfg, loadCfg, saveCfg, type CalibrationCfg } from '../lib/calibration';

export default function Calibrate() {
  const [cfg, setCfg] = useState<CalibrationCfg>(defaultCfg);
  const [count, setCount] = useState(4);
  const [on, setOn] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  const [zone, setZone] = useState<number | null>(null);
  const [seen, setSeen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState<{ left: number; result: string | null } | null>(null);
  const ema = useRef(new Ema(0.4));
  const lastSel = useRef<number | null>(null);
  const cfgRef = useRef(cfg); cfgRef.current = cfg;
  const countRef = useRef(count); countRef.current = count;

  useEffect(() => { loadCfg().then(setCfg); }, []);

  function handle(p: { x: number; y: number } | null, smooth: boolean) {
    if (!p) { setPt(null); setZone(null); setSeen(false); return; }
    const x = smooth ? ema.current.push(p.x) : p.x;
    if (!smooth) ema.current.reset();
    setPt({ x, y: p.y }); setSeen(true);
    const z = zoneAt(x, { count: countRef.current, gap: cfgRef.current.gap, mirror: cfgRef.current.mirror });
    setZone(z);
    if (z !== null) lastSel.current = z; // aturan arena: di area netral, pilihan terakhir tetap berlaku
  }

  const t = useCameraTracker({ enabled: on, deviceId: cfg.deviceId, minVis: cfg.minVis, onFrame: (p) => handle(p, true) });
  useEffect(() => {
    if (t.status === 'running') navigator.mediaDevices.enumerateDevices().then((d) => setDevices(d.filter((x) => x.kind === 'videoinput')));
  }, [t.status]);

  // Uji gerak 5 detik: meniru aturan arena (dinilai pada akhir hitungan)
  useEffect(() => {
    if (!test || test.result !== null) return;
    const id = setTimeout(() => {
      if (test.left > 1) setTest({ left: test.left - 1, result: null });
      else {
        const z = lastSel.current;
        setTest({ left: 0, result: z === null ? 'Belum ada zona terpilih (berdiri di zona atau coba simulasi).' : `Pilihan akhir: zona ${z + 1} (opsi ${String.fromCharCode(65 + z)}).` });
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [test]);

  const set = (p: Partial<CalibrationCfg>) => { setCfg({ ...cfg, ...p }); setSaved(false); };
  const status = t.status === 'running' ? (seen ? (zone !== null ? `Terdeteksi di zona ${zone + 1}` : 'Terdeteksi, di area netral') : 'Mencari tubuh… pastikan bahu/pinggul terlihat') : TRACKER_TEXT[t.status];

  return (
    <section>
      <div className="row sb">
        <div><h1>Kalibrasi Kamera & Zona Gerak</h1>
          <p className="muted" style={{ maxWidth: '64ch' }}>Atur zona agar deteksi posisi siswa akurat saat kuis. Video diproses di perangkat ini dan tidak direkam atau diunggah.</p></div>
        <span className={'pill ' + (t.status === 'running' ? 'ok' : 'out')}>{TRACKER_TEXT[t.status]}</span>
      </div>
      {t.message && <div role="alert" className="alert">{t.message}</div>}

      <div className="calib">
        <div>
          <div className="card">
            <div className="row sb" style={{ marginBottom: 12 }}>
              <button className="btn" onClick={() => setOn(!on)}><Icon name="camera" /> {on ? 'Matikan kamera' : 'Nyalakan kamera'}</button>
              <label className="row" style={{ margin: 0 }}><input type="checkbox" checked={cfg.mirror} onChange={(e) => set({ mirror: e.target.checked })} /> Balik layar (mirror)</label>
              <select aria-label="Pilih kamera" value={cfg.deviceId ?? ''} onChange={(e) => set({ deviceId: e.target.value || undefined })}>
                <option value="">Kamera default</option>{devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId.slice(0, 8)}</option>)}
              </select>
            </div>
            <CameraStage videoRef={t.videoRef} cfg={cfg} count={count} point={pt} zone={zone} selectedBadge="Terpilih"
              labels={Array.from({ length: count }, (_, i) => `Opsi ${String.fromCharCode(65 + i)}`)} />
            <p aria-live="polite" style={{ marginBottom: 0 }}><b>Status:</b> {status}</p>
          </div>

          <div className="card row sb">
            <div className="row"><span className="iconbox"><Icon name="user" /></span>
              <div><b>Simulasi posisi siswa</b><div className="muted">Uji tanpa kamera: tekan tombol untuk meletakkan titik di zona.</div></div></div>
            <div className="row">{Array.from({ length: count }, (_, i) => (
              <button key={i} className="btn alt sm" onClick={() => handle({ x: zoneCenterX(i, count, cfg.mirror), y: 0.6 }, false)}>Ke Z{i + 1}</button>))}</div>
          </div>
        </div>

        <div>
          <div className="card form">
            <h2>Pengaturan zona</h2>
            <div>Jumlah zona uji
              <div className="seg" role="group" aria-label="Jumlah zona" style={{ display: 'flex', marginTop: 6 }}>
                {[2, 3, 4].map((n) => <button key={n} className={count === n ? 'on' : ''} style={{ flex: 1 }} onClick={() => setCount(n)}>{n} zona</button>)}
              </div>
              <small className="muted">Pada permainan, jumlah zona mengikuti jumlah opsi soal (2–4).</small>
            </div>
            <label>Lebar area netral: <b>{Math.round(cfg.gap * 100)}%</b>
              <input type="range" min={0} max={0.6} step={0.05} value={cfg.gap} onChange={(e) => set({ gap: +e.target.value })} />
              <small className="muted">Celah antar zona agar gerakan kecil tidak salah pilih.</small></label>
            <label>Batas keyakinan deteksi: <b>{Math.round(cfg.minVis * 100)}%</b>
              <input type="range" min={0.2} max={0.9} step={0.05} value={cfg.minVis} onChange={(e) => set({ minVis: +e.target.value })} />
              <small className="muted">Lebih tinggi = lebih ketat; titik tubuh yang kurang jelas diabaikan.</small></label>
            <button className="btn xl" style={{ width: '100%' }} onClick={async () => { await saveCfg(cfg); setSaved(true); }}><Icon name="check" /> Simpan kalibrasi</button>
            <button className="btn alt" style={{ width: '100%', marginTop: 10 }} disabled={!!test && test.result === null} onClick={() => { lastSel.current = null; setTest({ left: 5, result: null }); }}>
              {test && test.result === null ? `Uji berjalan… ${test.left}` : 'Uji gerak siswa (5 detik)'}</button>
            {test?.result && <p role="status"><b>{test.result}</b></p>}
            {saved && <p className="ok" role="status">✔ Tersimpan di perangkat ini; otomatis dipakai saat kuis.</p>}
          </div>
          <div className="card hint"><h3>Tips guru</h3><p style={{ margin: 0 }}>Pastikan tubuh siswa terlihat dari bahu hingga pinggul dan ruangan cukup terang. Zona dihitung dari posisi di gambar kamera, bukan posisi lantai sebenarnya.</p></div>
          <div className="card hint g"><h3>Privasi</h3><p style={{ margin: 0 }}>Pemrosesan pose berjalan di perangkat ini. Gambar atau video webcam tidak direkam dan tidak dikirim ke server.</p></div>
        </div>
      </div>
    </section>
  );
}
