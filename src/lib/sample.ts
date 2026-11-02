import { db, uid } from '../db';
import type { Question, Quiz } from '../types';

/** Data contoh untuk demonstrasi (diberi label "(Contoh)"). */
export async function loadSampleQuiz() {
  const now = Date.now();
  const quiz: Quiz = {
    id: uid(), title: 'Contoh: IPA Dasar (Contoh)', description: 'Data contoh untuk demonstrasi.',
    subject: 'IPA', grade: 'Kelas 5 SD', difficulty: 'easy', tags: ['contoh'], archived: false, createdAt: now, updatedAt: now, schemaVersion: 1,
  };
  const tf = (order: number, prompt: string, truth: boolean, explanation: string): Question => ({
    id: uid(), quizId: quiz.id, order, type: 'true_false', prompt, instructions: '', imageAssetId: null,
    options: [{ id: 't', text: 'Benar' }, { id: 'f', text: 'Salah' }], correctOptionId: truth ? 't' : 'f',
    explanation, points: 10, timeLimitSeconds: 20, schemaVersion: 1,
  });
  const mc = (order: number, prompt: string, opts: string[], correct: number, explanation: string): Question => {
    const options = opts.map((text) => ({ id: uid(), text }));
    return {
      id: uid(), quizId: quiz.id, order, type: 'multiple_choice', prompt, instructions: '', imageAssetId: null,
      options, correctOptionId: options[correct].id, explanation, points: 10, timeLimitSeconds: 25, schemaVersion: 1,
    };
  };
  const qs = [
    tf(0, 'Matahari adalah sebuah bintang.', true, 'Matahari adalah bintang yang menjadi pusat tata surya.'),
    tf(1, 'Air membeku pada suhu 100 °C.', false, 'Air membeku pada 0 °C dan mendidih pada 100 °C.'),
    mc(2, 'Planet terbesar di tata surya adalah…', ['Bumi', 'Jupiter', 'Mars', 'Venus'], 1, 'Jupiter adalah planet terbesar.'),
    mc(3, 'Gas yang dihirup manusia untuk bernapas adalah…', ['Oksigen', 'Nitrogen', 'Hidrogen'], 0, 'Tubuh memerlukan oksigen untuk respirasi.'),
  ];
  await db.transaction('rw', db.quizzes, db.questions, async () => { await db.quizzes.add(quiz); await db.questions.bulkAdd(qs); });
  return quiz.id;
}
