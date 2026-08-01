import { describe, expect, it } from 'vitest';

import { mapWidgetTreeToLayers } from './map-widget-tree-to-layers';
import { readLayoutIntent, resolveAutoLayout } from './resolve-auto-layout';

describe(mapWidgetTreeToLayers, () => {
  it('maps Stack + Text + Rect into locked face layers', () => {
    const layers = mapWidgetTreeToLayers(
      {
        type: 'Stack',
        props: { direction: 'vertical', spacing: 8, padding: 16 },
        children: [
          {
            type: 'Text',
            props: { fontSize: 20, fill: '#000' },
            children: ['Hi'],
          },
          {
            type: 'Rect',
            props: { width: 100, height: 40, fill: '#eee' },
            children: [],
          },
        ],
      },
      { idPrefix: 'w1' }
    );

    expect(layers).toHaveLength(1);
    expect(layers[0]?.type).toBe('canvas.group');
    const data = layers[0]?.data as { children: unknown[] } | undefined;
    expect(data?.children).toHaveLength(2);
    expect(data?.children[0]).toMatchObject({
      type: 'canvas.text',
      writeMode: 'free',
      showInLayers: true,
    });
    expect(data?.children[1]).toMatchObject({
      type: 'canvas.rect',
      writeMode: 'free',
      showInLayers: true,
    });
  });

  it('records onClick handlers on Stack / Grid groups', () => {
    const handlers: Record<string, Record<string, string>> = {};
    const layers = mapWidgetTreeToLayers(
      {
        type: 'Stack',
        props: {
          direction: 'vertical',
          fill: '#eee',
          width: 100,
          height: 40,
          onClick: 'h2',
        },
        children: [],
      },
      { idPrefix: 'w2', handlersOut: handlers }
    );
    const groupId = layers[0]?.id;
    expect(groupId).toBeTruthy();
    expect(handlers[groupId!]?.click).toBe('h2');
  });
});

describe(resolveAutoLayout, () => {
  it('stacks children vertically with spacing', () => {
    const intent = readLayoutIntent({
      type: 'Stack',
      props: { direction: 'vertical', spacing: 10, padding: 0 },
      children: [],
    });
    expect(intent).not.toBeNull();
    if (!intent) {
      return;
    }
    const result = resolveAutoLayout(intent, [
      {
        id: 'a',
        type: 'canvas.rect',
        transform: {
          x: 0,
          y: 0,
          width: 50,
          height: 20,
          rotation: 0,
          opacity: 1,
        },
        data: { fill: '#000' },
      },
      {
        id: 'b',
        type: 'canvas.rect',
        transform: {
          x: 0,
          y: 0,
          width: 50,
          height: 20,
          rotation: 0,
          opacity: 1,
        },
        data: { fill: '#000' },
      },
    ]);
    expect(result.children[1]?.transform?.y).toBe(30);
    expect(result.height).toBe(50);
  });

  it('places Grid children in columns', () => {
    const intent = readLayoutIntent({
      type: 'Grid',
      props: { columns: 2, gap: 8 },
      children: [],
    });
    expect(intent?.kind).toBe('grid');
    if (!intent) {
      return;
    }
    const result = resolveAutoLayout(intent, [
      {
        id: 'a',
        type: 'canvas.rect',
        transform: {
          x: 0,
          y: 0,
          width: 40,
          height: 20,
          rotation: 0,
          opacity: 1,
        },
        data: {},
      },
      {
        id: 'b',
        type: 'canvas.rect',
        transform: {
          x: 0,
          y: 0,
          width: 40,
          height: 20,
          rotation: 0,
          opacity: 1,
        },
        data: {},
      },
      {
        id: 'c',
        type: 'canvas.rect',
        transform: {
          x: 0,
          y: 0,
          width: 40,
          height: 20,
          rotation: 0,
          opacity: 1,
        },
        data: {},
      },
    ]);
    expect(result.children[0]?.transform?.x).toBe(0);
    expect(result.children[1]?.transform?.x).toBe(48);
    expect(result.children[2]?.transform?.y).toBe(28);
  });
});
