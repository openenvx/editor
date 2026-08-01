import type { Layer, Scene } from '@openenvx/schema';
import { SCHEMA_VERSION } from '@openenvx/schema';

function transform(x: number, y: number, width = 80, height = 40) {
  return {
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
  };
}

function rect(id: string, x: number, y: number): Layer {
  return {
    id,
    type: 'canvas.rect',
    data: { fill: '#cccccc' },
    transform: transform(x, y),
  };
}

function text(id: string, x: number, y: number): Layer {
  return {
    id,
    type: 'canvas.text',
    data: { html: `<p>Label ${id}</p>`, align: 'left' },
    transform: transform(x, y, 120, 32),
  };
}

function group(id: string, children: Layer[], x: number, y: number): Layer {
  return {
    id,
    type: 'canvas.group',
    data: { children },
    transform: transform(x, y, 200, 200),
  };
}

/**
 * Build a synthetic absolute-layout scene with ~`layerCount` leaf+group nodes.
 * Mix: rects, text, nested groups (every 10th batch nested one level).
 */
export function buildSyntheticScene(layerCount: number): Scene {
  const layers: Layer[] = [];
  let made = 0;
  let i = 0;
  while (made < layerCount) {
    const x = (i % 20) * 100;
    const y = Math.floor(i / 20) * 100;
    if (i % 10 === 9 && made + 3 <= layerCount) {
      const childA = rect(`r-${i}-a`, 0, 0);
      const childB = text(`t-${i}-b`, 10, 50);
      layers.push(group(`g-${i}`, [childA, childB], x, y));
      made += 3;
    } else if (i % 2 === 0) {
      layers.push(rect(`r-${i}`, x, y));
      made += 1;
    } else {
      layers.push(text(`t-${i}`, x, y));
      made += 1;
    }
    i += 1;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    pages: [
      {
        id: 'page-1',
        name: 'Bench',
        layout: 'absolute',
        width: 2000,
        height: 2000,
        unit: 'px',
        dpi: 96,
        layers,
      },
    ],
  };
}

/** Move the first root layer by one pixel (path-copying transaction). */
export function nudgeFirstLayer(scene: Scene): Scene {
  const page = scene.pages[0]!;
  const first = page.layers[0];
  if (!first?.transform) {
    return scene;
  }
  return {
    ...scene,
    pages: scene.pages.map((p) =>
      p.id === page.id
        ? {
            ...p,
            layers: p.layers.map((layer, index) =>
              index === 0
                ? {
                    ...layer,
                    transform: {
                      ...layer.transform!,
                      x: (layer.transform?.x ?? 0) + 1,
                    },
                  }
                : layer
            ),
          }
        : p
    ),
  };
}
