import { z } from 'zod';
import { db, uid } from '../db';
import { ALLOWED_IMAGE, QuestionSchema, QuizSchema, type Question, type Quiz } from '../types';

const AssetPack = z.object({ id: z.string(), name: z.string().max(200), mime: z.string(), dataBase64: z.string() });
export const PackSchema = z.object({
  format: z.literal('smartlearn-motion'),
  schemaVersion: z.literal(1),
  quizzes: z.array(QuizSchema),
  questions: z.array(z.any()),
  assets: z.array(AssetPack),
});
export type Pack = z.infer<typeof PackSchema> & { questions: Question[] };
export const MAX_PACK_BYTES = 50 * 1024 * 1024;

const toB64 = (b: Blob) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res((r.result as string).split(',')[1] ?? '');
  r.onerror = () => rej(r.error);
  r.readAsDataURL(b);
});
const fromB64 = (b64: string, mime: string) => {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

export async function buildPack(quizIds?: string[]): Promise<Pack> {
  const quizzes = await (quizIds ? db.quizzes.bulkGet(quizIds).then((a) => a.filter(Boolean) as Quiz[]) : db.quizzes.toArray());
  const ids = new Set(quizzes.map((q) => q.id));
  const questions = (await db.questions.toArray()).filter((q) => ids.has(q.quizId));
  const assetIds = [...new Set(questions.map((q) => q.imageAssetId).filter((x): x is string => !!x))];
  const assets = [];
  for (const id of assetIds) {
    const a = await db.assets.get(id);
    if (a) assets.push({ id: a.id, name: a.name, mime: a.mime, dataBase64: await toB64(a.blob) });
  }
  return { format: 'smartlearn-motion', schemaVersion: 1, quizzes, questions, assets };
}

export function parsePack(text: string): { pack?: Pack; error?: string } {
  if (text.length > MAX_PACK_BYTES * 1.4) return { error: 'Berkas terlalu besar.' };
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { error: 'Berkas bukan JSON yang valid.' }; }
  const p = PackSchema.safeParse(raw);
  if (!p.success) return { error: 'Format/versi paket tidak dikenali: ' + p.error.issues[0]?.message };
  const questions: Question[] = [];
  for (const q of p.data.questions) {
    const r = QuestionSchema.safeParse(q);
    if (!r.success) return { error: 'Soal tidak valid: ' + r.error.issues[0]?.message };
    questions.push(r.data);
  }
  for (const a of p.data.assets) if (!ALLOWED_IMAGE.includes(a.mime)) return { error: `Tipe aset tidak diizinkan: ${a.mime}` };
  return { pack: { ...p.data, questions } };
}

/** mode 'copy' = buat ID baru (tidak menimpa); 'replace' = timpa ID yang sama. */
export async function applyPack(pack: Pack, mode: 'copy' | 'replace') {
  const qMap = new Map<string, string>(), aMap = new Map<string, string>();
  const nid = (m: Map<string, string>, old: string) => (mode === 'replace' ? old : m.get(old) ?? (m.set(old, uid()), m.get(old)!));
  await db.transaction('rw', db.quizzes, db.questions, db.assets, async () => {
    for (const a of pack.assets) await db.assets.put({ id: nid(aMap, a.id), name: a.name, mime: a.mime, blob: fromB64(a.dataBase64, a.mime) });
    for (const q of pack.quizzes) {
      const id = nid(qMap, q.id);
      await db.quizzes.put({ ...q, id, title: mode === 'copy' ? q.title + ' (salinan)' : q.title });
      if (mode === 'replace') await db.questions.where('quizId').equals(id).delete();
    }
    for (const q of pack.questions) {
      await db.questions.put({
        ...q,
        id: mode === 'replace' ? q.id : uid(),
        quizId: qMap.get(q.quizId) ?? q.quizId,
        imageAssetId: q.imageAssetId ? aMap.get(q.imageAssetId) ?? q.imageAssetId : null,
      });
    }
  });
}

export function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
