// Menyalin WASM MediaPipe dari node_modules dan mengunduh model pose (butuh internet SEKALI).
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

const wasmSrc = 'node_modules/@mediapipe/tasks-vision/wasm';
if (!existsSync(wasmSrc)) { console.error('Jalankan "npm install" dulu.'); process.exit(1); }
mkdirSync('public/mediapipe', { recursive: true });
cpSync(wasmSrc, 'public/mediapipe', { recursive: true });
console.log('WASM disalin ke public/mediapipe');

const url = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
mkdirSync('public/models', { recursive: true });
const res = await fetch(url);
if (!res.ok) { console.error('Gagal mengunduh model:', res.status); process.exit(1); }
writeFileSync('public/models/pose_landmarker_lite.task', Buffer.from(await res.arrayBuffer()));
console.log('Model disimpan di public/models/pose_landmarker_lite.task');
