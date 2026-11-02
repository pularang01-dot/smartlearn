import { useState, type CSSProperties, type RefObject, type SyntheticEvent } from 'react';
import type { CalibrationCfg } from '../lib/calibration';

export type ZoneResult = 'right' | 'wrong' | null;

/**
 * Kamera + zona jawaban + titik acuan. Rasio mengikuti video asli (tanpa crop), mirror konsisten dengan zoneAt().
 * zone = zona yang sedang dipilih (sementara); results = hijau/merah setelah waktu habis; onPick = zona bisa disentuh.
 */
export function CameraStage(p: {
  videoRef: RefObject<HTMLVideoElement>; cfg: CalibrationCfg; count: number;
  point: { x: number; y: number } | null; zone: number | null;
  labels?: string[]; results?: ZoneResult[]; onPick?: (i: number) => void; big?: boolean; selectedBadge?: string; hideVideo?: boolean;
}) {
  const [ar, setAr] = useState(16 / 9);
  const dx = p.point ? (p.cfg.mirror ? 1 - p.point.x : p.point.x) : null;
  return (
    <div className={'stage' + (p.big ? ' big' : '')} style={{ '--ar': ar } as CSSProperties} aria-label="Kamera dan zona jawaban">
      <video ref={p.videoRef} muted playsInline style={{ transform: p.cfg.mirror ? 'scaleX(-1)' : undefined, opacity: p.hideVideo ? 0 : 1 }}
        onLoadedMetadata={(e: SyntheticEvent<HTMLVideoElement>) => { const v = e.currentTarget; if (v.videoWidth && v.videoHeight) setAr(v.videoWidth / v.videoHeight); }} />
      <div className="zones">
        {Array.from({ length: p.count }, (_, i) => {
          const r = p.results?.[i] ?? null;
          const on = p.zone === i && !r;
          return (
            <div key={i} className="zone-slot" style={{ padding: `0 ${((p.cfg.gap / 2) * 100) / p.count}%` }}>
              <button type="button" className={'zone' + (on ? ' on' : '') + (r ? ' ' + r : '')} disabled={!p.onPick} onClick={() => p.onPick?.(i)}
                aria-label={`Zona ${i + 1}: ${p.labels?.[i] ?? ''}`}>
                <span className="zhead">
                  <em className="zl">{String.fromCharCode(65 + i)}</em>
                  {on && p.selectedBadge ? <strong className="zsel">● {p.selectedBadge}</strong> : <small>Zona {i + 1}</small>}
                </span>
                <span className="zlabel">{p.labels?.[i] ?? `Zona ${i + 1}`}</span>
                {r && <span className="zres">{r === 'right' ? '✔ Benar' : '✘ Salah'}</span>}
              </button>
            </div>
          );
        })}
      </div>
      {p.point && dx !== null && <b className="dot" style={{ left: `${dx * 100}%`, top: `${p.point.y * 100}%` }} />}
    </div>
  );
}
