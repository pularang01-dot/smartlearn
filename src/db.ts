import Dexie, { type Table } from 'dexie';
import type { Asset, Question, Quiz, Session } from './types';

class AppDB extends Dexie {
  quizzes!: Table<Quiz, string>;
  questions!: Table<Question, string>;
  assets!: Table<Asset, string>;
  sessions!: Table<Session, string>;
  kv!: Table<{ key: string; value: unknown }, string>;
  constructor() {
    super('smartlearn-motion');
    this.version(1).stores({
      quizzes: 'id, subject, updatedAt',
      questions: 'id, quizId, order',
      assets: 'id',
      sessions: 'id, quizId, startedAt',
      kv: 'key',
    });
  }
}
export const db = new AppDB();
export const uid = () => crypto.randomUUID();
