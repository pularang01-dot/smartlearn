import type { AnswerRecord, Method, Question } from '../types';
import { gradeAnswer } from './scoring';

export type Phase = 'idle' | 'countdown' | 'questionActive' | 'feedback' | 'paused' | 'completed';
export const COUNTDOWN_SECONDS = 3;

export interface GameState {
  phase: Phase;
  questions: Question[];
  players: string[];
  index: number;
  remaining: number;
  answers: AnswerRecord[];
  pausedFrom: Phase | null;
  /** Pilihan sementara; baru dinilai saat waktu habis (atau guru menekan Selesaikan). */
  selected: { optionId: string; method: Method } | null;
}

export type Action =
  | { type: 'START' }
  | { type: 'TICK' }
  | { type: 'SELECT'; optionId: string; method: Method }
  | { type: 'FINISH' }
  | { type: 'NEXT' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

export function initGame(questions: Question[], players: string[]): GameState {
  return { phase: 'idle', questions, players: players.length ? players : ['Pemain'], index: 0, remaining: 0, answers: [], pausedFrom: null, selected: null };
}

export const currentPlayer = (s: GameState) => s.index % s.players.length;

function lock(s: GameState, optionId: string | null, method: Method): GameState {
  const q = s.questions[s.index];
  const { correct, points } = gradeAnswer(q, optionId);
  const elapsedMs = (q.timeLimitSeconds - s.remaining) * 1000;
  const rec: AnswerRecord = { questionId: q.id, playerIndex: currentPlayer(s), optionId, correct, points, elapsedMs, method };
  return { ...s, phase: 'feedback', answers: [...s.answers, rec], selected: null };
}

export function reduce(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'START':
      return s.phase === 'idle' && s.questions.length ? { ...s, phase: 'countdown', remaining: COUNTDOWN_SECONDS } : s;
    case 'TICK':
      if (s.phase === 'countdown') {
        const r = s.remaining - 1;
        return r > 0 ? { ...s, remaining: r } : { ...s, phase: 'questionActive', remaining: s.questions[0].timeLimitSeconds };
      }
      if (s.phase === 'questionActive') {
        const r = s.remaining - 1;
        return r > 0 ? { ...s, remaining: r } : lock({ ...s, remaining: 0 }, s.selected?.optionId ?? null, s.selected?.method ?? 'timeout');
      }
      return s;
    case 'SELECT': // boleh berganti pilihan selama waktu berjalan; belum dinilai
      return s.phase === 'questionActive' ? { ...s, selected: { optionId: a.optionId, method: a.method } } : s;
    case 'FINISH': // guru menyelesaikan soal lebih awal: pilihan saat ini yang dinilai
      return s.phase === 'questionActive' ? lock(s, s.selected?.optionId ?? null, s.selected?.method ?? 'timeout') : s;
    case 'NEXT': {
      if (s.phase !== 'feedback') return s;
      const next = s.index + 1;
      if (next >= s.questions.length) return { ...s, phase: 'completed' };
      return { ...s, index: next, phase: 'questionActive', remaining: s.questions[next].timeLimitSeconds };
    }
    case 'PAUSE':
      return s.phase === 'countdown' || s.phase === 'questionActive' || s.phase === 'feedback'
        ? { ...s, phase: 'paused', pausedFrom: s.phase }
        : s;
    case 'RESUME':
      return s.phase === 'paused' && s.pausedFrom ? { ...s, phase: s.pausedFrom, pausedFrom: null } : s;
  }
}

export function totals(s: Pick<GameState, 'answers' | 'players'>): number[] {
  const t = s.players.map(() => 0);
  s.answers.forEach((a) => { t[a.playerIndex] += a.points; });
  return t;
}