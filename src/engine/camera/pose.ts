import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const base = import.meta.env.BASE_URL;
export const MODEL_URL = `${base}models/pose_landmarker_lite.task`;

/** Dev server mengembalikan index.html (200) untuk file yang tidak ada, jadi cek content-type. */
export async function modelAvailable(): Promise<boolean> {
  try {
    const r = await fetch(MODEL_URL, { method: 'HEAD' });
    return r.ok && !(r.headers.get('content-type') ?? '').includes('text/html');
  } catch { return false; }
}

export async function createPose(): Promise<PoseLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(`${base}mediapipe`);
  return PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: 'VIDEO',
    numPoses: 1,
  });
}
