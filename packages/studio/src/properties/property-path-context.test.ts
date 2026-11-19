import { describe, expect, it, vi } from 'vitest';

import { projectSnapshotFromLegacy } from '../test/document-fixtures';
import { PropertyPath } from './property-path';
import { createPropertyHostContext } from './property-path-context';

const scene = projectSnapshotFromLegacy({
  pages: [
    {
      id: 'p1',
      name: 'Page 1',
      layout: 'absolute',
      width: 800,
      height: 600,
      layers: [
        {
          id: 'a',
          type: 'test',
          data: { text: 'hi' },
          writeMode: 'free',
          showInLayers: true,
        },
      ],
    },
  ],
  templatePolicy: {
    version: 1,
    allowInsertLayers: true,
    allowDeleteLayers: true,
    allowDuplicateLayers: true,
    allowArtboardResize: true,
  },
}).document;

describe('createPropertyHostContext', () => {
  it('reads and writes layer data paths', () => {
    const updateProperty = vi.fn();
    const ctx = createPropertyHostContext({
      executeCommand: vi.fn(),
      layerData: { text: 'hi' },
      scene,
      selectedLayerId: 'a',
      updateProperty,
    });
    expect(ctx.readPath(PropertyPath.layerData('text'))).toBe('hi');
    ctx.writePath(PropertyPath.layerData('text'), 'bye');
    expect(updateProperty).toHaveBeenCalledWith('a', 'text', 'bye');
  });

});
