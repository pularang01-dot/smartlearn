/** Logika murni (tanpa DOM) untuk memetakan posisi tubuh ke zona jawaban. Koordinat gambar ternormalisasi 0..1. */
export interface Landmark { x: number; y: number; visibility?: number }
export interface ZoneConfig { count: number; gap: number; mirror: boolean }

const vis = (l?: Landmark) => (l ? l.visibility ?? 1 : 0);

/** Titik acuan: tengah pinggul; fallback tengah bahu; null bila tidak cukup terlihat. */
export function referencePoint(lm: Landmark[], minVis = 0.5): { x: number; y: number } | null {
  const pairs: [number, number][] = [[23, 24], [11, 12]];
  for (const [a, b] of pairs) {
    const A = lm[a], B = lm[b];
    if (vis(A) >= minVis && vis(B) >= minVis) return { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  }
  return null;
}

/** Zona = N strip vertikal pada tampilan (setelah mirror). Area gap di tepi strip dianggap netral (null). */
export function zoneAt(x: number, cfg: ZoneConfig): number | null {
  const dx = cfg.mirror ? 1 - x : x;
  if (dx < 0 || dx > 1) return null;
  const w = 1 / cfg.count;
  const idx = Math.min(cfg.count - 1, Math.floor(dx / w));
  const local = (dx - idx * w) / w;
  return local < cfg.gap / 2 || local > 1 - cfg.gap / 2 ? null : idx;
}

/** Titik tengah zona ke-i dalam koordinat gambar (untuk simulasi posisi); kebalikan dari zoneAt(). */
export function zoneCenterX(i: number, count: number, mirror: boolean): number {
  const dx = (i + 0.5) / count;
  return mirror ? 1 - dx : dx;
}

export class Ema {
  private v: number | null = null;
  constructor(private alpha = 0.4) {}
  push(x: number) { this.v = this.v === null ? x : this.alpha * x + (1 - this.alpha) * this.v; return this.v; }
  reset() { this.v = null; }
}

export type TrackStatus = 'searching' | 'unstable' | 'tracking' | 'locked' | 'rearm';
export interface SelectorResult { status: TrackStatus; zone: number | null; progress: number; lock: number | null }

/** Debounce + re-arm: zona harus ditahan `holdMs`; setelah kunci, butuh posisi netral `neutralMs` sebelum menerima lagi. */
export class ZoneSelector {
  private armed = true;
  private cand: number | null = null;
  private since = 0;
  private neutralSince: number | null = null;
  constructor(private holdMs = 1200, private neutralMs = 600) {}

  configure(holdMs: number, neutralMs: number) { this.holdMs = holdMs; this.neutralMs = neutralMs; }
  reset(requireNeutral: boolean) { this.armed = !requireNeutral; this.cand = null; this.neutralSince = null; }

  update(zone: number | null, t: number, confident: boolean): SelectorResult {
    if (!confident) { this.cand = null; this.neutralSince = null; return { status: 'unstable', zone: null, progress: 0, lock: null }; }
    if (!this.armed) {
      if (zone === null) {
        this.neutralSince ??= t;
        if (t - this.neutralSince >= this.neutralMs) { this.armed = true; this.neutralSince = null; }
      } else this.neutralSince = null;
      if (!this.armed) return { status: 'rearm', zone, progress: 0, lock: null };
    }
    if (zone === null) { this.cand = null; return { status: 'tracking', zone: null, progress: 0, lock: null }; }
    if (this.cand !== zone) { this.cand = zone; this.since = t; }
    const progress = Math.min(1, (t - this.since) / this.holdMs);
    if (progress >= 1) { this.armed = false; this.cand = null; this.neutralSince = null; return { status: 'locked', zone, progress: 1, lock: zone }; }
    return { status: 'tracking', zone, progress, lock: null };
  }
}
