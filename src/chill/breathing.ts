/** 4-7-8 breathing: inhale for 4 s, hold for 7 s, exhale for 8 s. */
export const BREATH_PHASES = [
  { id: 'inhale', seconds: 4 },
  { id: 'hold', seconds: 7 },
  { id: 'exhale', seconds: 8 },
] as const;

export type BreathPhaseId = (typeof BREATH_PHASES)[number]['id'];

/** Length of one full breath, in seconds. */
export const BREATH_CYCLE = BREATH_PHASES.reduce((sum, p) => sum + p.seconds, 0);

export interface BreathState {
  phase: BreathPhaseId;
  /** Seconds spent in the current phase. */
  elapsed: number;
  /** Seconds left in the current phase. */
  remaining: number;
  /** 0..1 through the current phase. */
  progress: number;
  /** Completed breaths before this one. */
  cycle: number;
  /** Lung fill, 0 (empty) to 1 (full): smooth in and out, held at 1 in between. */
  fill: number;
}

function easeInOutSine(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

/** State of the guided breath `seconds` after it started (negative times clamp to the start). */
export function breathAt(seconds: number): BreathState {
  const t = Math.max(0, seconds);
  const cycle = Math.floor(t / BREATH_CYCLE);
  let local = t - cycle * BREATH_CYCLE;
  for (const { id, seconds: length } of BREATH_PHASES) {
    if (local < length) {
      const progress = local / length;
      const fill = id === 'inhale' ? easeInOutSine(progress) : id === 'hold' ? 1 : 1 - easeInOutSine(progress);
      return { phase: id, elapsed: local, remaining: length - local, progress, cycle, fill };
    }
    local -= length;
  }
  // Unreachable (local < BREATH_CYCLE), kept for the type checker.
  return { phase: 'exhale', elapsed: 8, remaining: 0, progress: 1, cycle, fill: 0 };
}
