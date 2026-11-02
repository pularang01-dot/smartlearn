/** Cincin waktu: berubah amber + berdenyut pada 5 detik terakhir (animasi dimatikan oleh prefers-reduced-motion). */
export function TimerRing({ remaining, total, label }: { remaining: number; total: number; label?: string }) {
  const r = 40, c = 2 * Math.PI * r;
  const f = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const low = remaining > 0 && remaining <= 5;
  return (
    <div className={'ring' + (low ? ' low' : '')} role="timer" aria-label={`Sisa waktu ${remaining} detik`}>
      <svg viewBox="0 0 100 100" width="96" height="96">
        <circle cx="50" cy="50" r={r} className="ring-bg" />
        <circle cx="50" cy="50" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - f)} transform="rotate(-90 50 50)" />
      </svg>
      <span><b>{label ?? remaining}</b><small>detik</small></span>
    </div>
  );
}
