import { describe, expect, it } from 'vitest';

import { BlockRegistry } from './block-registry';
import type { BlockConfig } from './block-config';

function stubConfig(type: string, label = type): BlockConfig {
  return {
    type,
    label,
    fields: {},
    defaultData: {},
    render: () => <div>{label}</div>,
  };
}

describe('BlockRegistry', () => {
  it('registers, gets, and lists configs', () => {
    const registry = new BlockRegistry();
    const heading = stubConfig('html.heading', 'Heading');
    registry.register(heading);

    expect(registry.get('html.heading')).toBe(heading);
    expect(registry.get('missing')).toBeUndefined();
    expect(registry.getAll()).toEqual([heading]);
  });

  it('excludes root and palette:false blocks from palette', () => {
    const registry = new BlockRegistry();
    registry.register(stubConfig('html.root'));
    registry.register({ ...stubConfig('html.container'), palette: false });
    registry.register(stubConfig('html.flex', 'Flex'));
    registry.register(stubConfig('html.text', 'Text'));

    expect(registry.getPaletteBlocks().map((b) => b.type)).toEqual([
      'html.flex',
      'html.text',
    ]);
  });
});
