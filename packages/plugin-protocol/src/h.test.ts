import { describe, expect, it } from 'vitest';

import { Button, Panel, Text } from './elements';
import { beginRender, endRender, h, type HandlerRegistry } from './h';

describe('h', () => {
  it('serializes element trees without handlers', () => {
    const node = h(Panel, { title: 'Assets' }, h(Text, { tone: 'muted' }, 'Hi'));
    expect(node.type).toBe('Panel');
    expect(node.props.title).toBe('Assets');
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toMatchObject({
      type: 'Text',
      props: { tone: 'muted' },
      children: ['Hi'],
    });
  });

  it('replaces function props with handler ids inside beginRender', () => {
    const registry: HandlerRegistry = new Map();
    beginRender(registry);
    const onClick = () => {};
    const node = h(Button, { onClick }, 'Go');
    endRender();
    expect(typeof node.props.onClick).toBe('string');
    expect(registry.get(node.props.onClick as string)).toBe(onClick);
  });

  it('throws when a handler is used outside beginRender', () => {
    expect(() => h(Button, { onClick: () => {} })).toThrow(/beginRender/);
  });
});
