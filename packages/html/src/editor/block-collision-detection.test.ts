import { beforeEach, describe, expect, it, vi } from 'vitest';

const pointerWithin = vi.fn();
const closestCenter = vi.fn();

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    pointerWithin: (...args: unknown[]) => pointerWithin(...args),
    closestCenter: (...args: unknown[]) => closestCenter(...args),
  };
});

// vi.mock is hoisted; keep the subject import after the mock factory.
const { blockCollisionDetection } = await import('./block-dnd');

describe('blockCollisionDetection', () => {
  beforeEach(() => {
    pointerWithin.mockReset();
    closestCenter.mockReset();
  });

  it('sorts leaf blocks ahead of nestable ones', () => {
    pointerWithin.mockReturnValue([
      {
        id: 'nest',
        data: {
          current: {
            type: 'block',
            blockId: 'nest',
            parentId: 'root',
            index: 0,
            acceptsChildren: true,
          },
        },
      },
      {
        id: 'leaf',
        data: {
          current: {
            type: 'block',
            blockId: 'leaf',
            parentId: 'root',
            index: 1,
            acceptsChildren: false,
          },
        },
      },
      {
        id: 'zone:root',
        data: { current: { type: 'zone', parentId: 'root' } },
      },
    ]);

    const result = blockCollisionDetection({} as never);
    expect(result.map((c) => c.id)).toEqual(['leaf', 'nest']);
    expect(closestCenter).not.toHaveBeenCalled();
  });

  it('returns pointer zone collisions when no blocks collide', () => {
    const zones = [
      {
        id: 'zone:root',
        data: { current: { type: 'zone', parentId: 'root' } },
      },
    ];
    pointerWithin.mockReturnValue(zones);
    expect(blockCollisionDetection({} as never)).toBe(zones);
  });

  it('falls back to closestCenter when pointer has no hits', () => {
    pointerWithin.mockReturnValue([]);
    closestCenter.mockReturnValue([{ id: 'fallback' }]);
    expect(blockCollisionDetection({} as never)).toEqual([{ id: 'fallback' }]);
  });
});
