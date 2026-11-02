import { describe, expect, it } from 'vitest';
import { initGame, reduce, totals, type GameState } from '../src/engine/game';
import { gradeAnswer } from '../src/engine/scoring';
import { prepareQuestions, shuffleSeeded } from '../src/engine/shuffle';
import { QuestionSchema, type Question } from '../src/types';

const mk = (i: number, correct = 't'): Question => ({
  id: 'q' + i, quizId: 'z', order: i, type: 'true_false', prompt: 'P' + i, instructions: '', imageAssetId: null,
  options: [{ id: 't', text: 'Benar' }, { id: 'f', text: 'Salah' }], correctOptionId: correct,
  explanation: '', points: 10, timeLimitSeconds: 5, schemaVersion: 1,
});
const run = (s: GameState, ...a: Parameters<typeof reduce>[1][]) => a.reduce(reduce, s);
const toActive = (s: GameState) => run(s, { type: 'START' }, { type: 'TICK' }, { type: 'TICK' }, { type: 'TICK' });

describe('scoring', () => {
  it('benar = poin, salah/timeout = 0', () => {
    expect(gradeAnswer(mk(0), 't')).toEqual({ correct: true, points: 10 });
    expect(gradeAnswer(mk(0), 'f')).toEqual({ correct: false, points: 0 });
    expect(gradeAnswer(mk(0), null).correct).toBe(false);
  });
});

describe('schema', () => {
  it('menolak kunci yang tidak ada di opsi', () => {
    expect(QuestionSchema.safeParse({ ...mk(0), correctOptionId: 'x' }).success).toBe(false);
    expect(QuestionSchema.safeParse(mk(0)).success).toBe(true);
  });
  it('soal gambar wajib punya gambar', () => {
    expect(QuestionSchema.safeParse({ ...mk(0), type: 'image' }).success).toBe(false);
  });
});

describe('game engine', () => {
  it('countdown lalu soal aktif', () => {
    const s = toActive(initGame([mk(0)], ['A']));
    expect(s.phase).toBe('questionActive');
    expect(s.remaining).toBe(5);
  });
  it('memilih TIDAK langsung menilai; boleh berpindah; dinilai saat waktu habis', () => {
    let s = toActive(initGame([mk(0), mk(1)], ['A']));            // waktu 5 dtk, kunci = 't'
    s = run(s, { type: 'SELECT', optionId: 't', method: 'camera' }, { type: 'TICK' }, { type: 'TICK' });
    expect(s.phase).toBe('questionActive');                       // masih berjalan walau sudah di zona benar
    expect(s.answers).toHaveLength(0);
    s = run(s, { type: 'SELECT', optionId: 'f', method: 'camera' }); // berpindah ke zona salah
    s = run(s, { type: 'TICK' }, { type: 'TICK' });
    expect(s.phase).toBe('questionActive');                       // sisa 1 dtk
    s = reduce(s, { type: 'TICK' });
    expect(s.phase).toBe('feedback');
    expect(s.answers).toHaveLength(1);
    expect(s.answers[0]).toMatchObject({ optionId: 'f', correct: false, method: 'camera', elapsedMs: 5000 });
  });
  it('pindah ke zona benar di detik terakhir dinilai benar', () => {
    let s = toActive(initGame([mk(0)], ['A']));
    s = run(s, { type: 'SELECT', optionId: 'f', method: 'camera' }, { type: 'TICK' }, { type: 'TICK' }, { type: 'TICK' }, { type: 'TICK' });
    s = run(s, { type: 'SELECT', optionId: 't', method: 'camera' }, { type: 'TICK' });
    expect(s.answers[0]).toMatchObject({ optionId: 't', correct: true, points: 10 });
  });
  it('FINISH (guru) menilai pilihan saat ini lebih awal', () => {
    let s = toActive(initGame([mk(0)], ['A']));
    s = run(s, { type: 'SELECT', optionId: 't', method: 'touch' }, { type: 'FINISH' });
    expect(s.phase).toBe('feedback');
    expect(s.answers[0].correct).toBe(true);
  });
  it('waktu habis merekam jawaban kosong', () => {
    let s = toActive(initGame([mk(0)], ['A']));
    for (let i = 0; i < 5; i++) s = reduce(s, { type: 'TICK' });
    expect(s.phase).toBe('feedback');
    expect(s.answers[0]).toMatchObject({ optionId: null, correct: false, method: 'timeout' });
  });
  it('pause membekukan timer dan resume memulihkan', () => {
    let s = toActive(initGame([mk(0)], ['A']));
    s = run(s, { type: 'PAUSE' }, { type: 'TICK' }, { type: 'TICK' });
    expect(s.remaining).toBe(5);
    expect(run(s, { type: 'SELECT', optionId: 't', method: 'touch' }).selected).toBeNull(); // input diabaikan saat jeda
    expect(reduce(s, { type: 'RESUME' }).phase).toBe('questionActive');
  });
  it('giliran bergantian dan skor per pemain; jawaban lama tidak hilang', () => {
    const ans = (id: string) => [{ type: 'SELECT', optionId: id, method: 'touch' }, { type: 'FINISH' }, { type: 'NEXT' }] as const;
    let s = toActive(initGame([mk(0), mk(1), mk(2)], ['A', 'B']));
    s = run(s, ...ans('t'), ...ans('f'), ...ans('t'));
    expect(s.phase).toBe('completed');
    expect(s.answers.map((a) => a.playerIndex)).toEqual([0, 1, 0]);
    expect(totals(s)).toEqual([20, 0]);
  });
});

describe('shuffle', () => {
  it('deterministik per seed dan tidak kehilangan item', () => {
    const a = shuffleSeeded([1, 2, 3, 4, 5, 6], 42);
    expect(a).toEqual(shuffleSeeded([1, 2, 3, 4, 5, 6], 42));
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('kunci jawaban tetap valid setelah opsi diacak', () => {
    const q: Question = { ...mk(0), type: 'multiple_choice', options: [1, 2, 3, 4].map((n) => ({ id: 'o' + n, text: 'O' + n })), correctOptionId: 'o3' };
    prepareQuestions([q], true, 7).forEach((x) => expect(QuestionSchema.safeParse(x).success).toBe(true));
  });
});