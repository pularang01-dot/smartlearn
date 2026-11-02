import { useState } from 'react';
import { applyPack, buildPack, download, MAX_PACK_BYTES, parsePack, type Pack } from '../lib/exportImport';

export default function Backup() {
  const [pack, setPack] = useState<Pack | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function exportAll() {
    try { const p = await buildPack(); download('smartlearn-backup.json', JSON.stringify(p), 'application/json'); setMsg(`Diekspor: ${p.quizzes.length} kuis, ${p.questions.length} soal, ${p.assets.length} gambar.`); setErr(''); }
    catch (e) { setErr('Ekspor gagal: ' + (e as Error).message); }
  }
  async function pick(f?: File) {
    setMsg(''); setPack(null);
    if (!f) return;
    if (f.size > MAX_PACK_BYTES) return setErr('Berkas lebih dari 50 MB.');
    const r = parsePack(await f.text());
    if (r.error) return setErr(r.error);
    setErr(''); setPack(r.pack!);
  }
  async function apply(mode: 'copy' | 'replace') {
    if (!pack) return;
    if (mode === 'replace' && !confirm('Kuis dengan ID yang sama akan DITIMPA. Lanjutkan?')) return;
    try { await applyPack(pack, mode); setMsg('Impor berhasil.'); setPack(null); } catch (e) { setErr('Impor gagal: ' + (e as Error).message); }
  }
  return (
    <section>
      <h1>Backup & Pindah Perangkat</h1>
      <p className="muted">Paket JSON berisi kuis, soal, dan gambar (base64). Sinkronisasi cloud belum diimplementasikan pada versi ini.</p>
      <div className="card"><button className="btn" onClick={exportAll}>⬇ Ekspor semua kuis</button></div>
      <div className="card form">
        <label>Impor paket (.json)<input type="file" accept="application/json,.json" onChange={(e) => pick(e.target.files?.[0])} /></label>
        {pack && (<>
          <p>Pratinjau: {pack.quizzes.length} kuis, {pack.questions.length} soal, {pack.assets.length} gambar.</p>
          <div className="row"><button className="btn" onClick={() => apply('copy')}>Impor sebagai salinan baru</button>
            <button className="btn danger o" onClick={() => apply('replace')}>Timpa kuis ber-ID sama</button></div></>)}
      </div>
      {msg && <p className="ok" role="status">{msg}</p>}
      {err && <div role="alert" className="alert">{err}</div>}
    </section>
  );
}
