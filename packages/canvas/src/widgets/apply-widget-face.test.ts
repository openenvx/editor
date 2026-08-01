import { describe, expect, it } from 'vitest';
import { createDefaultTransform } from '@openenvx/schema';

import { applyWidgetFace } from './apply-widget-face';

describe(applyWidgetFace, () => {
  it('unwraps root group, syncs size, and keeps nested face children', () => {
    const widget = {
      id: 'w1',
      type: 'openenvx.widget',
      transform: {
        ...createDefaultTransform(),
        x: 40,
        y: 60,
        width: 240,
        height: 160,
      },
      data: {
        extensionId: 'demo',
        values: { title: 'Hi' },
        children: [],
      },
    };

    const next = applyWidgetFace(widget, {
      type: 'Stack',
      props: {
        direction: 'vertical',
        gap: 8,
        padding: 16,
        fill: '#fff',
        width: 200,
      },
      children: [
        {
          type: 'Text',
          props: { bind: 'title', fontSize: 18, value: 'Hi' },
          children: [],
        },
        {
          type: 'Rect',
          props: { width: 120, height: 40, fill: '#eee' },
          children: [],
        },
      ],
    });

    expect(next.transform).toMatchObject({
      x: 40,
      y: 60,
      width: 200,
    });
    const data = next.data as {
      children: { type: string; writeMode?: string }[];
      handlers?: unknown;
    };
    // Unwrapped: bg rect + laid-out children (no nested root group).
    expect(data.children.length).toBeGreaterThanOrEqual(2);
    expect(data.children.every((child) => child.type !== 'openenvx.widget')).toBe(
      true
    );
    expect(
      data.children.some(
        (child) => child.type === 'canvas.text' && child.writeMode === 'free'
      )
    ).toBe(true);
  });

  it('records Stack onClick handlers on nested groups after Grid unwrap', () => {
    const widget = {
      id: 'seat',
      type: 'openenvx.widget',
      transform: { ...createDefaultTransform(), width: 240, height: 160 },
      data: { extensionId: 'wm.seating', values: {}, children: [] },
    };

    const next = applyWidgetFace(widget, {
      type: 'Grid',
      props: { columns: 2, gap: 12, width: 220, height: 180 },
      children: [
        {
          type: 'Stack',
          props: {
            direction: 'vertical',
            fill: '#d1fae5',
            width: 88,
            height: 72,
            onClick: 'h1',
          },
          children: [
            {
              type: 'Text',
              props: { fontSize: 14 },
              children: ['Table 1'],
            },
          ],
        },
      ],
    });

    const data = next.data as {
      children: { id: string; type: string }[];
      handlers?: Record<string, Record<string, string>>;
    };
    expect(next.transform?.width).toBe(220);
    expect(next.transform?.height).toBe(180);
    expect(data.children[0]?.type).toBe('canvas.group');
    const groupId = data.children[0]?.id;
    expect(groupId).toBeTruthy();
    expect(data.handlers?.[groupId!]?.click).toBe('h1');
  });

  it('retargets root Stack onClick to the widget id after unwrap', () => {
    const widget = {
      id: 'w-root',
      type: 'openenvx.widget',
      transform: { ...createDefaultTransform(), width: 100, height: 100 },
      data: { extensionId: 'x', values: {}, children: [] },
    };

    const next = applyWidgetFace(widget, {
      type: 'Stack',
      props: {
        direction: 'vertical',
        fill: '#fff',
        width: 160,
        height: 80,
        onClick: 'h9',
      },
      children: [
        {
          type: 'Text',
          props: { fontSize: 12 },
          children: ['x'],
        },
      ],
    });

    const data = next.data as {
      handlers?: Record<string, Record<string, string>>;
    };
    expect(data.handlers?.['w-root']?.click).toBe('h9');
  });
});
