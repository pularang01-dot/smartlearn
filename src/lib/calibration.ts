import { db } from '../db';

export interface CalibrationCfg { deviceId?: string; mirror: boolean; gap: number; holdMs: number; neutralMs: number; minVis: number }
export const defaultCfg: CalibrationCfg = { mirror: true, gap: 0.2, holdMs: 1200, neutralMs: 600, minVis: 0.5 };

export async function loadCfg(): Promise<CalibrationCfg> {
  const row = await db.kv.get('calibration');
  return { ...defaultCfg, ...((row?.value as Partial<CalibrationCfg>) ?? {}) };
}
export const saveCfg = (c: CalibrationCfg) => db.kv.put({ key: 'calibration', value: c });
