import type { ArtboardOffset } from '../artboard-offset';
import type {
  UserGuide,
  UserGuideOrientation,
} from './canvas-ruler-guides-settings';

export const RULER_SIZE_PX = 20;

const NICE_STEPS = [
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000,
];

/** Major tick step in artboard pixels so labels stay ~50–80px apart on screen. */
export function computeRulerTickStep(zoom: number): number {
  const safeZoom = Math.max(zoom, 0.01);
  const targetArtboard = 60 / safeZoom;
  for (const step of NICE_STEPS) {
    if (step >= targetArtboard) {
      return step;
    }
  }
  return NICE_STEPS.at(-1) ?? 1000;
}

export function screenToArtboardPoint(
  screenX: number,
  screenY: number,
  artboardOffset: ArtboardOffset,
  zoom: number
): { x: number; y: number } {
  const safeZoom = Math.max(zoom, 0.01);
  return {
    x: (screenX - artboardOffset.x) / safeZoom,
    y: (screenY - artboardOffset.y) / safeZoom,
  };
}

export function artboardToScreenPoint(
  artboardX: number,
  artboardY: number,
  artboardOffset: ArtboardOffset,
  zoom: number
): { x: number; y: number } {
  return {
    x: artboardOffset.x + artboardX * zoom,
    y: artboardOffset.y + artboardY * zoom,
  };
}

export function userGuidesToSnapAxes(guides: readonly UserGuide[]): {
  xs: number[];
  ys: number[];
} {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const guide of guides) {
    if (guide.orientation === 'vertical') {
      xs.push(guide.position);
    } else {
      ys.push(guide.position);
    }
  }
  return { xs, ys };
}

export interface RulerTick {
  label?: string;
  /** Position along the ruler axis in screen pixels (relative to stage origin). */
  screen: number;
  major: boolean;
}

export function buildRulerTicks(input: {
  artboardSize: number;
  offset: number;
  zoom: number;
  /** Visible range start in screen px relative to stage host. */
  viewStart: number;
  viewEnd: number;
}): RulerTick[] {
  const step = computeRulerTickStep(input.zoom);
  const minorStep = step / 5;
  const safeZoom = Math.max(input.zoom, 0.01);
  const artboardStart = (input.viewStart - input.offset) / safeZoom;
  const artboardEnd = (input.viewEnd - input.offset) / safeZoom;
  const first = Math.floor(artboardStart / minorStep) * minorStep;
  const ticks: RulerTick[] = [];

  for (
    let value = first;
    value <= artboardEnd + minorStep;
    value += minorStep
  ) {
    if (value < -minorStep || value > input.artboardSize + minorStep) {
      continue;
    }
    const screen = input.offset + value * input.zoom;
    if (screen < input.viewStart - 1 || screen > input.viewEnd + 1) {
      continue;
    }
    const major =
      Math.abs(value % step) < 0.001 || Math.abs((value % step) - step) < 0.001;
    ticks.push({
      label: major ? String(Math.round(value)) : undefined,
      major,
      screen,
    });
  }
  return ticks;
}

export function isGuideWithinArtboard(
  orientation: UserGuideOrientation,
  position: number,
  artboardWidth: number,
  artboardHeight: number
): boolean {
  if (orientation === 'vertical') {
    return position >= 0 && position <= artboardWidth;
  }
  return position >= 0 && position <= artboardHeight;
}
