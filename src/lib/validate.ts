import { QuestionSchema, type Question } from '../types';

export function questionError(q: Question): string | null {
  const r = QuestionSchema.safeParse(q);
  return r.success ? null : r.error.issues.map((i) => i.message).join('; ');
}

export function validateForPlay(qs: Question[]): string[] {
  if (!qs.length) return ['Kuis belum memiliki soal.'];
  const errs: string[] = [];
  qs.forEach((q, i) => { const e = questionError(q); if (e) errs.push(`Soal ${i + 1}: ${e}`); });
  return errs;
}
