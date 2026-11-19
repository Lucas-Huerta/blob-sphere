import * as THREE from 'three';
import { interpret, nextPinching, readPose, zoomFactor, type Hand, type HandState } from './gestures';
import { OneEuroFilter } from './smoothing';

/** Intents produced by hand tracking; mirrors what mouse/touch produce. */
export interface HandIntents {
  /** A pinch started at `ndc`; returns whether it landed on the blob. */
  pinchStart(ndc: THREE.Vector2): boolean;
  /** Pinch point moved while holding the blob. */
  pinchMove(ndc: THREE.Vector2): void;
  pinchEnd(): void;
  /** Open hand position (NDC), or null when no open hand is visible. */
  openHand(ndc: THREE.Vector2 | null): void;
  /** Camera-distance multiplier from the two-hand pinch (1 = neutral). */
  zoom(factor: number): void;
  /** Screen position the hand points at (pinch point or open palm), null when none; drives a small cursor. */
  cursor(ndc: THREE.Vector2 | null, pinching: boolean): void;
  /** Number of hands currently seen (for the status indicator). */
  handsSeen(count: number): void;
}

const ZOOM_MIN = 0.55;
const ZOOM_MAX = 1.8;

type Mode = 'idle' | 'open' | 'pinch' | 'zoom';

/** Turns raw landmarks into smoothed, debounced blob intents. */
export class HandController {
  private pinching: boolean[] = [false, false];
  private filters = Array.from({ length: 2 }, () => ({ x: new OneEuroFilter(), y: new OneEuroFilter() }));
  private mode: Mode = 'idle';
  private grabbing = false;
  private zoomStart = 0;
  private zoomValue = 1;
  private zoomBase = 1;
  /** Frames without a hand before the state is dropped, to ride out detection blips. */
  private missed = 0;

  constructor(
    private intents: HandIntents,
    private aspect: () => number,
  ) {}

  update(hands: Hand[], dt: number): void {
    this.intents.handsSeen(hands.length);
    if (hands.length === 0) {
      if (++this.missed > 4) {
        this.exit();
        this.intents.cursor(null, false);
      }
      return;
    }
    this.missed = 0;

    const states: HandState[] = hands.slice(0, 2).map((h, i) => {
      const pose = readPose(h);
      const f = this.filters[i];
      pose.pinchPoint = { x: f.x.filter(pose.pinchPoint.x, dt), y: f.y.filter(pose.pinchPoint.y, dt) };
      this.pinching[i] = nextPinching(this.pinching[i], pose.pinchRatio);
      return { pose, pinching: this.pinching[i] };
    });
    // Hand slots that vanished must not keep a stale pinch.
    for (let i = states.length; i < 2; i++) this.pinching[i] = false;

    const frame = interpret(states, this.aspect());
    const ndc = (p: { x: number; y: number }) => new THREE.Vector2(p.x * 2 - 1, -(p.y * 2 - 1));

    const entered = frame.kind !== this.mode;
    if (entered) this.enter(frame.kind, frame.zoomDistance);

    switch (frame.kind) {
      case 'pinch':
        // A pinch that began off the blob can still catch it once the hand slides over it.
        if (!this.grabbing) this.grabbing = this.intents.pinchStart(ndc(frame.pinchPoint!));
        else this.intents.pinchMove(ndc(frame.pinchPoint!));
        this.intents.cursor(ndc(frame.pinchPoint!), true);
        break;
      case 'open':
        this.intents.openHand(ndc(frame.palm!));
        this.intents.cursor(ndc(frame.palm!), false);
        break;
      case 'zoom': {
        const target = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.zoomBase * zoomFactor(this.zoomStart, frame.zoomDistance!)));
        this.zoomValue += (target - this.zoomValue) * Math.min(1, dt * 10);
        this.intents.zoom(this.zoomValue);
        this.intents.cursor(null, true);
        break;
      }
      default:
        this.intents.cursor(states[0] ? ndc(states[0].pose.pinchPoint) : null, false);
        break;
    }
  }

  /** Releases everything, e.g. when tracking stops. */
  reset(): void {
    this.exit();
    this.intents.handsSeen(0);
    this.intents.cursor(null, false);
  }

  private enter(next: Mode, zoomDistance = 0): void {
    this.leave(this.mode);
    this.mode = next;
    if (next === 'zoom') {
      this.zoomStart = zoomDistance;
      this.zoomBase = this.zoomValue;
    }
  }

  private leave(prev: Mode): void {
    if (prev === 'pinch' && this.grabbing) {
      this.grabbing = false;
      this.intents.pinchEnd();
    }
    if (prev === 'open') this.intents.openHand(null);
    // Zoom keeps its last value so the blob does not snap back when a hand is lowered.
  }

  private exit(): void {
    this.leave(this.mode);
    this.mode = 'idle';
    this.pinching = [false, false];
    this.filters.forEach((f) => {
      f.x.reset();
      f.y.reset();
    });
  }
}
