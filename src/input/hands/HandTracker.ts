import type { Hand } from './gestures';

export type TrackerError = 'denied' | 'no-camera' | 'unsupported' | 'model';

export class TrackerFailure extends Error {
  constructor(readonly reason: TrackerError) {
    super(reason);
  }
}

const MODEL_URL = '/models/hand_landmarker.task';
const WASM_URL = '/mediapipe/wasm';
/** Cap detection rate; 30 fps is plenty for hand control and spares the GPU. */
const MIN_FRAME_MS = 1000 / 30;

type FrameListener = (hands: Hand[], dt: number) => void;

/**
 * Runs MediaPipe hand detection on the webcam, entirely in the browser.
 * The video element is never shown, no frame is drawn, stored or sent anywhere:
 * only the 21 landmark coordinates per hand leave this class.
 * MediaPipe is imported lazily, so nothing is loaded unless the user opts in.
 */
export class HandTracker {
  private video = document.createElement('video');
  private stream?: MediaStream;
  private landmarker?: import('@mediapipe/tasks-vision').HandLandmarker;
  private listener?: FrameListener;
  private stopListener?: () => void;
  private raf = 0;
  private lastDetect = 0;
  private lastVideoTime = -1;

  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) throw new TrackerFailure('unsupported');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      throw new TrackerFailure(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'no-camera' : 'denied');
    }

    try {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      const base = { modelAssetPath: MODEL_URL };
      const options = { runningMode: 'VIDEO' as const, numHands: 2, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.4, minTrackingConfidence: 0.4 };
      try {
        this.landmarker = await HandLandmarker.createFromOptions(fileset, { ...options, baseOptions: { ...base, delegate: 'GPU' } });
      } catch {
        this.landmarker = await HandLandmarker.createFromOptions(fileset, { ...options, baseOptions: { ...base, delegate: 'CPU' } });
      }
    } catch {
      this.stop();
      throw new TrackerFailure('model');
    }

    // Invisible, off-flow element: required for the stream to keep playing in some browsers.
    const v = this.video;
    v.setAttribute('aria-hidden', 'true');
    v.muted = true;
    v.playsInline = true;
    v.srcObject = this.stream ?? null;
    Object.assign(v.style, { position: 'fixed', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none', left: '0', top: '0' });
    document.body.append(v);
    await v.play();

    // Stop cleanly if the user revokes the camera from the browser UI.
    this.stream?.getVideoTracks().forEach((t) => t.addEventListener('ended', () => this.stop()));
    this.loop();
  }

  get active(): boolean {
    return this.raf !== 0;
  }

  onFrame(listener: FrameListener): void {
    this.listener = listener;
  }

  /** Called whenever tracking ends, including when the user revokes the camera from the browser. */
  onStop(listener: () => void): void {
    this.stopListener = listener;
  }

  /** Releases the camera (the browser's recording indicator turns off) and the model. */
  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
    this.video.srcObject = null;
    this.video.remove();
    this.landmarker?.close();
    this.landmarker = undefined;
    this.listener?.([], 0);
    this.stopListener?.();
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const v = this.video;
    if (!this.landmarker || v.readyState < 2 || v.currentTime === this.lastVideoTime) return;
    if (now - this.lastDetect < MIN_FRAME_MS) return;
    const dt = (now - this.lastDetect) / 1000;
    this.lastDetect = now;
    this.lastVideoTime = v.currentTime;
    const result = this.landmarker.detectForVideo(v, now);
    this.listener?.(result.landmarks, Math.min(dt, 0.1));
  };
}
