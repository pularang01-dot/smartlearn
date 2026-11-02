import type { Session } from '../types';

/** Ketepatan sesi 0–100, atau null bila belum ada jawaban. */
export function sessionAccuracy(s: Pick<Session, 'answers'>): number | null {
  return s.answers.length ? Math.round((s.answers.filter((a) => a.correct).length / s.answers.length) * 100) : null;
}
/** Rata-rata ketepatan seluruh sesi (hanya data nyata), null bila belum ada sesi. */
export function averageAccuracy(sessions: Pick<Session, 'answers'>[]): number | null {
  const v = sessions.map(sessionAccuracy).filter((x): x is number => x !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
