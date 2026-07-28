// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  editableAttrsForTag,
  parseSvgElements,
  setSvgElementAttrs,
} from './svg-node-list';

const SAMPLE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
  '<rect width="24" height="24" rx="4" fill="currentColor"/>' +
  '<path d="M4 12h16" stroke="#000" fill="none"/>' +
  '</svg>';

describe('svg-node-list', () => {
  it('parses a flat element list and roundtrips attr edits', () => {
    const nodes = parseSvgElements(SAMPLE);
    expect(nodes.map((n) => n.tag)).toEqual(['svg', 'rect', 'path']);
    expect(nodes[1]?.attrs.fill).toBe('currentColor');
    expect(nodes[2]?.attrs.d).toBe('M4 12h16');

    const next = setSvgElementAttrs(SAMPLE, 1, {
      fill: '#ff0000',
      rx: '8',
    });
    const after = parseSvgElements(next);
    expect(after[1]?.attrs.fill).toBe('#ff0000');
    expect(after[1]?.attrs.rx).toBe('8');
    expect(after[1]?.attrs.width).toBe('24');
    expect(after[2]?.attrs.d).toBe('M4 12h16');
  });

  it('lists tag-relevant editable attrs', () => {
    expect(editableAttrsForTag('path')).toContain('d');
    expect(editableAttrsForTag('circle')).toEqual(
      expect.arrayContaining(['fill', 'stroke', 'cx', 'cy', 'r'])
    );
  });
});
