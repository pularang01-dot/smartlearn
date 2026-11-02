import type { Question } from '../types';

/** Aturan skor: benar = poin penuh soal; salah / waktu habis = 0. Jawaban salah tetap direkam. */
export function gradeAnswer(q: Question, optionId: string | null): { correct: boolean; points: number } {
  const correct = optionId !== null && optionId === q.correctOptionId;
  return { correct, points: correct ? q.points : 0 };
}
