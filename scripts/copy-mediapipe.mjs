// Copies the MediaPipe WASM runtime into public/ so it is served from our own origin
// (no third-party request when the user enables the camera).
import { cpSync, mkdirSync } from 'node:fs';

const src = new URL('../node_modules/@mediapipe/tasks-vision/wasm/', import.meta.url);
const dest = new URL('../public/mediapipe/wasm/', import.meta.url);
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
