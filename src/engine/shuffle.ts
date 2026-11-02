import type { Question } from '../types';

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded<T>(items: readonly T[], seed: number): T[] {
  const rnd = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Acak urutan soal dan opsi pilihan ganda (Benar/Salah tidak diacak). Deterministik per seed. */
export function prepareQuestions(qs: Question[], shuffle: boolean, seed: number): Question[] {
  if (!shuffle) return qs;
  return shuffleSeeded(qs, seed).map((q, i) =>
    q.type === 'true_false' ? q : { ...q, options: shuffleSeeded(q.options, seed + i + 1) },
  );
}
