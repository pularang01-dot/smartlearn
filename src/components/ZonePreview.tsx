import type { Question } from '../types';

/** Pratinjau zona kamera untuk satu soal (strip vertikal, sama dengan yang dipakai di Arena). */
export function ZonePreview({ q }: { q: Question }) {
  if (q.options.length > 4) return <p className="muted">Lebih dari 4 opsi: soal ini dijawab dengan sentuh/keyboard, bukan kamera.</p>;
  return (
    <div className="zprev" aria-label="Pratinjau zona kamera">
      {q.options.map((o, i) => (
        <div key={o.id} className={'zp' + (o.id === q.correctOptionId ? ' right' : '')}>
          <em>{String.fromCharCode(65 + i)}</em>
          <span>{o.text || '…'}</span>
          {o.id === q.correctOptionId && <small>✔ kunci</small>}
        </div>
      ))}
    </div>
  );
}
