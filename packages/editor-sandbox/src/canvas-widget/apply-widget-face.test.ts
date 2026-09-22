import { describe, expect, it } from 'vitest';
import {
  applyNodeTransform,
  createDefaultTransform,
  nodeTransform,
  type OpenEnvxWidgetProps,
} from '@openenvx/studio/schema';

import { applyWidgetFace } from './apply-widget-face';

function widgetNode(
  id: string,
  frame: Partial<ReturnType<typeof createDefaultTransform>>,
  props: OpenEnvxWidgetProps
) {
  return applyNodeTransform(
    {
      id,
      type: 'openenvx.widget',
      props,
      children: [],
    },
    { ...createDefaultTransform(), ...frame }
  );
}

describe(applyWidgetFace, () => {
  it('unwraps root group, syncs size, and keeps nested face children', () => {
    const widget = widgetNode(
      'w1',
      { x: 40, y: 60, width: 240, height: 160 },
      {
        extensionId: 'demo',
        values: { title: 'Hi' },
      }
    );

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

    expect(nodeTransform(next)).toMatchObject({
      x: 40,
      y: 60,
      width: 200,
    });
    const children = next.children ?? [];
    expect(children.length).toBeGreaterThanOrEqual(2);
    expect(children.every((child) => child.type !== 'openenvx.widget')).toBe(
      true
    );
    expect(
      children.some(
        (child) => child.type === 'canvas.text' && child.writeMode === 'free'
      )
    ).toBe(true);
  });

  it('records Stack onClick handlers on nested groups after Grid unwrap', () => {
    const widget = widgetNode(
      'seat',
      { width: 240, height: 160 },
      { extensionId: 'wm.seating', values: {} }
    );

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

    const props = next.props as OpenEnvxWidgetProps;
    const children = next.children ?? [];
    expect(nodeTransform(next).width).toBe(220);
    expect(nodeTransform(next).height).toBe(180);
    expect(children[0]?.type).toBe('canvas.group');
    const groupId = children[0]?.id;
    expect(groupId).toBeTruthy();
    expect(props.handlers?.[groupId!]?.click).toBe('h1');
  });

  it('retargets root Stack onClick to the widget id after unwrap', () => {
    const widget = widgetNode('w-root', { width: 100, height: 100 }, {
      extensionId: 'x',
      values: {},
    });

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

    const props = next.props as OpenEnvxWidgetProps;
    expect(props.handlers?.['w-root']?.click).toBe('h9');
  });
});
