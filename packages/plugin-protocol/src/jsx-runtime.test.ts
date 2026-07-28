import { describe, expect, it } from 'vitest';

import { Stack, Text } from './elements';
import { jsx, jsxs } from './jsx-runtime';

describe('jsx-runtime', () => {
  it('jsx passes key through to h', () => {
    const node = jsx(Text, { tone: 'muted' }, 'k1');
    expect(node.type).toBe('Text');
    expect(node.key).toBe('k1');
  });

  it('jsxs nests children from props', () => {
    const node = jsxs(Stack, {
      gap: 'sm',
      children: [jsx(Text, {}, 'a'), jsx(Text, {}, 'b')],
    });
    expect(node.type).toBe('Stack');
    expect(node.children).toHaveLength(2);
  });
});
