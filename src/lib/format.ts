export function relTime(ms: number, now = Date.now()): string {
  const s = Math.floor((now - ms) / 1000);
  if (s < 60) return 'Baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 172800) return 'Kemarin';
  if (s < 604800) return `${Math.floor(s / 86400)} hari lalu`;
  return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
export const DIFFICULTY: Record<string, string> = { easy: 'Mudah', medium: 'Sedang', hard: 'Sulit' };
