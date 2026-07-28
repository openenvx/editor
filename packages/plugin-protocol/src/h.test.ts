import { describe, expect, it } from 'vitest';

import { Pane, Text } from './elements';
import { beginRender, endRender, h, type HandlerRegistry } from './h';

describe('h', () => {
  it('serializes element trees without handlers', () => {
    const node = h(
      Pane,
      { id: 'assets', title: 'Assets' },
      h(Text, { key: 'hi', label: 'Hi', tone: 'muted' })
    );
    expect(node.type).toBe('Pane');
    expect(node.props.title).toBe('Assets');
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toMatchObject({
      type: 'Text',
      props: { label: 'Hi', tone: 'muted' },
    });
  });

  it('replaces function props with handler ids inside beginRender', () => {
    const registry: HandlerRegistry = new Map();
    beginRender(registry);
    const onClick = () => {};
    const node = h(Text, { label: 'Go', onClick });
    endRender();
    expect(typeof node.props.onClick).toBe('string');
    expect(registry.get(node.props.onClick as string)).toBe(onClick);
  });

  it('throws when a handler is used outside beginRender', () => {
    expect(() => h(Text, { onClick: () => {} })).toThrow(/beginRender/);
  });
});
