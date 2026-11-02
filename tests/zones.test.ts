import { describe, expect, it } from 'vitest';
import { Ema, referencePoint, zoneAt, ZoneSelector, type Landmark } from '../src/engine/camera/zones';

const cfg = { count: 2, gap: 0.2, mirror: false };

describe('zoneAt', () => {
  it('memetakan x ke zona dan gap netral', () => {
    expect(zoneAt(0.25, cfg)).toBe(0);
    expect(zoneAt(0.75, cfg)).toBe(1);
    expect(zoneAt(0.5, cfg)).toBeNull(); // batas tengah = netral
    expect(zoneAt(1.2, cfg)).toBeNull();
  });
  it('mirror membalik koordinat konsisten', () => {
    expect(zoneAt(0.25, { ...cfg, mirror: true })).toBe(1);
  });
});

describe('referencePoint', () => {
  const lm = (v: number): Landmark[] => Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: v }));
  it('null bila confidence rendah', () => expect(referencePoint(lm(0.1))).toBeNull());
  it('pinggul bila terlihat; fallback bahu', () => {
    expect(referencePoint(lm(0.9))).toEqual({ x: 0.5, y: 0.5 });
    const l = lm(0.9); l[23].visibility = 0.1;
    expect(referencePoint(l)).not.toBeNull();
  });
});

describe('ZoneSelector', () => {
  it('menahan zona cukup lama memicu tepat satu kunci', () => {
    const s = new ZoneSelector(1000, 500);
    const locks: number[] = [];
    for (let t = 0; t <= 3000; t += 100) { const r = s.update(0, t, true); if (r.lock !== null) locks.push(r.lock); }
    expect(locks).toEqual([0]); // tetap di zona = tidak terpicu ulang
  });
  it('noise sesaat tidak mengunci', () => {
    const s = new ZoneSelector(1000, 500);
    let any = false;
    for (let t = 0; t < 3000; t += 100) { const r = s.update(t % 400 === 0 ? 0 : 1, t, true); any ||= r.lock !== null; }
    expect(any).toBe(false);
  });
  it('confidence rendah tidak mengunci', () => {
    const s = new ZoneSelector(500, 500);
    for (let t = 0; t < 3000; t += 100) expect(s.update(0, t, false).lock).toBeNull();
  });
  it('re-arm: butuh posisi netral sebelum menerima jawaban berikutnya', () => {
    const s = new ZoneSelector(300, 300);
    s.update(0, 0, true); expect(s.update(0, 400, true).lock).toBe(0);
    s.reset(true);
    for (let t = 500; t < 1500; t += 100) expect(s.update(1, t, true).lock).toBeNull(); // masih di zona
    let t = 1500; for (; t < 2000; t += 100) s.update(null, t, true); // netral
    let got: number | null = null;
    for (; t < 3000; t += 100) { const r = s.update(1, t, true); if (r.lock !== null) got = r.lock; }
    expect(got).toBe(1);
  });
});

describe('Ema', () => {
  it('menghaluskan lonjakan', () => {
    const e = new Ema(0.5); e.push(0);
    expect(e.push(1)).toBe(0.5);
  });
});
