/** Pure landmarks → gestures logic. No camera, no DOM: fully testable. */

export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

/** One hand: 21 MediaPipe landmarks, coordinates normalised to the camera image (0..1). */
export type Hand = readonly Landmark[];

const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const PINKY_MCP = 17;
const FINGERS: ReadonlyArray<readonly [tip: number, pip: number]> = [
  [8, 6],
  [12, 10],
  [16, 14],
  [20, 18],
];

/** Pinch hysteresis, as a ratio of thumb–index distance to hand size. */
export const PINCH_ENTER = 0.42;
export const PINCH_EXIT = 0.7;

export interface HandPose {
  /** Pinch centre (thumb/index midpoint) in mirrored screen space, 0..1, origin top-left. */
  pinchPoint: { x: number; y: number };
  /** Palm centre in mirrored screen space, 0..1. */
  palm: { x: number; y: number };
  /** Raw thumb-to-index distance relative to the hand size. */
  pinchRatio: number;
  /** Hand size (wrist → middle knuckle) in image units. */
  size: number;
  /** All four fingers extended. */
  open: boolean;
}

const dist = (a: Landmark, b: Landmark): number => Math.hypot(a.x - b.x, a.y - b.y);
/** Includes MediaPipe's relative depth, so a hand tilted towards the camera still measures right. */
const dist3 = (a: Landmark, b: Landmark): number => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));

/** The camera image is shown mirrored to the user, so x is flipped. */
const mirror = (p: { x: number; y: number }): { x: number; y: number } => ({ x: 1 - p.x, y: p.y });

export function readPose(hand: Hand): HandPose {
  // Palm length or width, whichever is larger: stays stable when the hand turns sideways.
  const size = Math.max(dist3(hand[WRIST], hand[MIDDLE_MCP]), dist3(hand[INDEX_MCP], hand[PINKY_MCP]), 1e-4);
  const thumb = hand[THUMB_TIP];
  const index = hand[INDEX_TIP];
  const wrist = hand[WRIST];
  // A finger is extended when its tip is farther from the wrist than its middle joint.
  const open = FINGERS.every(([tip, pip]) => dist(hand[tip], wrist) > dist(hand[pip], wrist) * 1.05);
  const mcp = hand[MIDDLE_MCP];
  return {
    pinchPoint: mirror({ x: (thumb.x + index.x) / 2, y: (thumb.y + index.y) / 2 }),
    palm: mirror({ x: (wrist.x + mcp.x) / 2, y: (wrist.y + mcp.y) / 2 }),
    pinchRatio: dist3(thumb, index) / size,
    size,
    open,
  };
}

/** Pinch state with hysteresis, so the grip does not flicker around the threshold. */
export function nextPinching(wasPinching: boolean, ratio: number): boolean {
  return wasPinching ? ratio < PINCH_EXIT : ratio < PINCH_ENTER;
}

export type GestureKind = 'idle' | 'open' | 'pinch' | 'zoom';

export interface GestureFrame {
  kind: GestureKind;
  /** Pinch point in mirrored screen space (0..1) while a single hand pinches. */
  pinchPoint?: { x: number; y: number };
  /** Open palm position in mirrored screen space (0..1). */
  palm?: { x: number; y: number };
  /** Distance between the two pinching hands (screen-width units) while zooming. */
  zoomDistance?: number;
}

export interface HandState {
  pose: HandPose;
  pinching: boolean;
}

/**
 * Picks the active gesture from the tracked hands.
 * Two pinching hands → zoom, one pinching hand → grab, one open hand → move, otherwise idle.
 */
export function interpret(hands: readonly HandState[], aspect: number): GestureFrame {
  const pinching = hands.filter((h) => h.pinching);
  if (pinching.length >= 2) {
    const [a, b] = pinching;
    const dx = (a.pose.pinchPoint.x - b.pose.pinchPoint.x) * aspect;
    const dy = a.pose.pinchPoint.y - b.pose.pinchPoint.y;
    return { kind: 'zoom', zoomDistance: Math.hypot(dx, dy) };
  }
  if (pinching.length === 1) return { kind: 'pinch', pinchPoint: pinching[0].pose.pinchPoint };
  const open = hands.find((h) => h.pose.open);
  if (open) return { kind: 'open', palm: open.pose.palm };
  return { kind: 'idle' };
}

/** Converts a zoom-distance ratio (now / start) into a clamped camera-distance multiplier. */
export function zoomFactor(startDistance: number, currentDistance: number, min = 0.55, max = 1.8): number {
  if (startDistance <= 1e-4) return 1;
  // Hands moving apart brings the blob closer, so the camera distance shrinks.
  const f = startDistance / Math.max(currentDistance, 1e-4);
  return Math.min(max, Math.max(min, f));
}
