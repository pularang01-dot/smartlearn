import { useEffect, useRef, useState } from 'react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { createPose, modelAvailable } from './pose';
import { referencePoint } from './zones';

export type TrackerStatus = 'off' | 'loading' | 'running' | 'no-model' | 'denied' | 'no-camera' | 'error';
export type FrameHandler = (p: { x: number; y: number } | null, t: number) => void;

export function useCameraTracker(opts: { enabled: boolean; deviceId?: string; minVis: number; onFrame: FrameHandler }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cb = useRef(opts.onFrame); cb.current = opts.onFrame;
  const minVis = useRef(opts.minVis); minVis.current = opts.minVis;
  const [status, setStatus] = useState<TrackerStatus>('off');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!opts.enabled) { setStatus('off'); return; }
    let stop = false; let raf = 0;
    let stream: MediaStream | undefined; let lm: PoseLandmarker | undefined;
    (async () => {
      try {
        setStatus('loading'); setMessage('');
        if (!(await modelAvailable())) {
          setStatus('no-model');
          setMessage('Model pose belum ada di public/models. Jalankan "npm run prepare:assets" (butuh internet sekali).');
          return;
        }
        lm = await createPose();
        if (stop) { lm.close(); return; }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
        });
        if (stop) { stream.getTracks().forEach((t) => t.stop()); lm.close(); return; }
        const v = videoRef.current!;
        v.srcObject = stream; await v.play();
        setStatus('running');
        let last = 0; let lastVideoTime = -1;
        const loop = () => {
          if (stop) return;
          raf = requestAnimationFrame(loop);
          const now = performance.now();
          if (now - last < 66 || v.readyState < 2 || v.currentTime === lastVideoTime) return;
          last = now; lastVideoTime = v.currentTime;
          const res = lm!.detectForVideo(v, now);
          const pts = res.landmarks[0];
          cb.current(pts ? referencePoint(pts, minVis.current) : null, now);
        };
        loop();
      } catch (e) {
        const err = e as Error;
        setStatus(err.name === 'NotAllowedError' ? 'denied' : err.name === 'NotFoundError' ? 'no-camera' : 'error');
        setMessage(err.message);
      }
    })();
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); lm?.close(); };
  }, [opts.enabled, opts.deviceId]);

  return { videoRef, status, message };
}

export const TRACKER_TEXT: Record<TrackerStatus, string> = {
  off: 'Kamera mati', loading: 'Memuat model & kamera…', running: 'Kamera aktif',
  'no-model': 'Model pose belum tersedia', denied: 'Izin kamera ditolak — izinkan di pengaturan browser',
  'no-camera': 'Kamera tidak ditemukan', error: 'Kamera/model gagal dijalankan',
};