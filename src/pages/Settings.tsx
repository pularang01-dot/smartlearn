import { useEffect, useState } from 'react';
import { applyTheme, getTheme, type Theme } from '../lib/theme';
import { db } from '../db';
import { buildPack, download } from '../lib/exportImport';

export default function Settings() {
  const [theme, setTheme] = useState<Theme>(getTheme());
  const [usage, setUsage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage(`${((e.usage ?? 0) / 1048576).toFixed(1)} MB dari ${((e.quota ?? 0) / 1048576).toFixed(0)} MB`));
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);
  async function reset() {
    if (!confirm('Hapus SEMUA data lokal (kuis, hasil, kalibrasi)? Disarankan ekspor dulu.')) return;
    if (confirm('Ekspor backup sebelum menghapus?')) download('smartlearn-backup.json', JSON.stringify(await buildPack()), 'application/json');
    await db.delete(); location.reload();
  }
  return (
    <section>
      <h1>Pengaturan</h1>
      <div className="card form">
        <label>Tema<select value={theme} onChange={(e) => { const t = e.target.value as Theme; setTheme(t); applyTheme(t); }}>
          <option value="system">Ikuti sistem</option><option value="light">Terang</option><option value="dark">Gelap</option></select></label>
        <p>Jaringan: {online ? '🟢 online' : '🟠 offline'} · Penyimpanan: {usage || 'tidak tersedia'}</p>
        <p className="muted">Privasi: video kamera hanya diproses di memori, tidak disimpan atau diunggah. Tidak ada pengenalan wajah. Nama pemain hanya disimpan di hasil lokal.</p>
        <button className="btn danger o" onClick={reset}>🗑 Reset semua data</button>
      </div>
    </section>
  );
}
