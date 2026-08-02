import { describe, expect, it } from 'vitest';

import {
  absoluteSnapToNodePosition,
  nodePositionToAbsolute,
} from './absolute-snap-to-node-position';

describe('nodePositionToAbsolute', () => {
  it('maps nested node coords to artboard-absolute position', () => {
    // Child relative (10, 10); parent offset makes absolute (110, 60).
    const relative = { x: 10, y: 10 };
    const absolute = { x: 110, y: 60 };
    // Node dragged to relative (20, 20) → absolute (120, 70).
    expect(nodePositionToAbsolute(20, 20, relative, absolute)).toEqual({
      x: 120,
      y: 70,
    });
  });

  it('is a no-op for root layers where absolute equals relative', () => {
    const transform = { x: 40, y: 50 };
    expect(nodePositionToAbsolute(48, 56, transform, transform)).toEqual({
      x: 48,
      y: 56,
    });
  });
});

describe('absoluteSnapToNodePosition', () => {
  it('maps absolute snap back to parent-relative node coords', () => {
    // Child at relative (10, 10); parent offset makes absolute (110, 60).
    const relative = { x: 10, y: 10 };
    const absolute = { x: 110, y: 60 };
    // Snap wants absolute (120, 70) → relative (20, 20).
    expect(absoluteSnapToNodePosition(120, 70, relative, absolute)).toEqual({
      x: 20,
      y: 20,
    });
  });

  it('is a no-op for root layers where absolute equals relative', () => {
    const transform = { x: 40, y: 50 };
    expect(absoluteSnapToNodePosition(48, 56, transform, transform)).toEqual({
      x: 48,
      y: 56,
    });
  });

  it('round-trips with nodePositionToAbsolute for nested layers', () => {
    const relative = { x: 10, y: 10 };
    const absolute = { x: 110, y: 60 };
    const liveAbsolute = nodePositionToAbsolute(20, 20, relative, absolute);
    expect(
      absoluteSnapToNodePosition(
        liveAbsolute.x,
        liveAbsolute.y,
        relative,
        absolute
      )
    ).toEqual({ x: 20, y: 20 });
  });
});
