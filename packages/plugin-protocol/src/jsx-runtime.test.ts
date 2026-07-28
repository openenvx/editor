import { describe, expect, it } from 'vitest';

import { InputGroup, Text } from './elements';
import { jsx, jsxs } from './jsx-runtime';

describe('jsx-runtime', () => {
  it('jsx passes key through to h', () => {
    const node = jsx(Text, { label: 'Hi', tone: 'muted' }, 'k1');
    expect(node.type).toBe('Text');
    expect(node.key).toBe('k1');
  });

  it('jsxs nests children from props', () => {
    const node = jsxs(InputGroup, {
      label: 'Group',
      children: [jsx(Text, { label: 'a' }, 'a'), jsx(Text, { label: 'b' }, 'b')],
    });
    expect(node.type).toBe('InputGroup');
    expect(node.children).toHaveLength(2);
  });
});
