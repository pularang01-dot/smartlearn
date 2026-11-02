import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { download } from '../lib/exportImport';
import { totals } from '../engine/game';
import type { Session } from '../types';

const csvCell = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;

function toCsv(sessions: Session[]) {
  const rows = [['sesi', 'kuis', 'mulai', 'pemain', 'soal', 'jawaban_benar', 'poin', 'waktu_ms', 'metode']];
  sessions.forEach((s) => s.answers.forEach((a) => rows.push([
    s.id, s.quizTitle, new Date(s.startedAt).toISOString(), s.players[a.playerIndex],
    s.questions.find((q) => q.id === a.questionId)?.prompt ?? '', String(a.correct), String(a.points), String(a.elapsedMs), a.method,
  ])));
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

export default function Results() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray(), []) ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const list = sessions.filter((s) => s.quizTitle.toLowerCase().includes(filter.toLowerCase()));
  return (
    <section>
      <h1>Hasil Belajar</h1>
      <div className="row">
        <input aria-label="Filter kuis" placeholder="Filter judul kuis…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button className="btn alt" disabled={!list.length} onClick={() => download('hasil.csv', toCsv(list), 'text/csv')}>⬇ CSV</button>
        <button className="btn alt" disabled={!list.length} onClick={() => download('hasil.json', JSON.stringify(list, null, 2), 'application/json')}>⬇ JSON</button>
      </div>
      {!list.length && <p className="muted">Belum ada sesi. Mainkan kuis untuk melihat hasil.</p>}
      {list.map((s) => {
        const t = totals(s);
        const ok = s.answers.filter((a) => a.correct).length;
        return (
          <div className="card" key={s.id}>
            <button className="btn alt" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? '▾' : '▸'} {s.quizTitle} — {new Date(s.startedAt).toLocaleString('id-ID')}</button>
            <p>Benar {ok}/{s.answers.length} ({s.answers.length ? Math.round((ok / s.answers.length) * 100) : 0}%) · {s.players.map((p, i) => `${p}: ${t[i]}`).join(' · ')}</p>
            {open === s.id && (
              <table><thead><tr><th>Soal</th><th>Pemain</th><th>Hasil</th><th>Waktu</th><th>Metode</th></tr></thead>
                <tbody>{s.answers.map((a) => {
                  const q = s.questions.find((x) => x.id === a.questionId);
                  return <tr key={a.questionId}><td>{q?.prompt}</td><td>{s.players[a.playerIndex]}</td>
                    <td>{a.optionId === null ? '⌛ Waktu habis' : a.correct ? '✔ Benar' : '✘ Salah'}</td><td>{Math.round(a.elapsedMs / 1000)} dtk</td><td>{a.method}</td></tr>;
                })}</tbody></table>
            )}
          </div>
        );
      })}
    </section>
  );
}
