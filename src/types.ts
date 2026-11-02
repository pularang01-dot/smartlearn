import { z } from 'zod';

export const OptionSchema = z.object({ id: z.string().min(1), text: z.string().trim().min(1, 'Teks opsi wajib diisi') });

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    quizId: z.string().min(1),
    order: z.number().int().min(0),
    type: z.enum(['true_false', 'multiple_choice', 'image']),
    prompt: z.string().trim().min(1, 'Pertanyaan wajib diisi'),
    instructions: z.string().default(''),
    imageAssetId: z.string().nullable().default(null),
    options: z.array(OptionSchema).min(2, 'Minimal 2 opsi'),
    correctOptionId: z.string().min(1),
    explanation: z.string().default(''),
    points: z.number().int().min(0).max(1000).default(10),
    timeLimitSeconds: z.number().int().min(5).max(600).default(20),
    schemaVersion: z.literal(1).default(1),
  })
  .refine((q) => q.options.some((o) => o.id === q.correctOptionId), { message: 'Kunci jawaban harus salah satu opsi' })
  .refine((q) => q.type !== 'image' || !!q.imageAssetId, { message: 'Soal bergambar wajib memiliki gambar' })
  .refine((q) => q.type !== 'true_false' || q.options.length === 2, { message: 'Benar/Salah harus 2 opsi' });

export const QuizSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, 'Judul wajib diisi'),
  description: z.string().default(''),
  subject: z.string().default(''),
  grade: z.string().default(''),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tags: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
  schemaVersion: z.literal(1).default(1),
});

export type Question = z.infer<typeof QuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export interface Asset { id: string; name: string; mime: string; blob: Blob }

export type Method = 'camera' | 'touch' | 'keyboard' | 'timeout';
export interface AnswerRecord {
  questionId: string; playerIndex: number; optionId: string | null;
  correct: boolean; points: number; elapsedMs: number; method: Method;
}
export interface Session {
  id: string; quizId: string; quizTitle: string; startedAt: number; finishedAt: number;
  mode: 'camera' | 'touch'; players: string[]; seed: number;
  questions: { id: string; prompt: string; explanation: string }[]; answers: AnswerRecord[];
}

export const ALLOWED_IMAGE = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
