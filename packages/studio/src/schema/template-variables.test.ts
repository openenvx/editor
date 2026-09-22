import { describe, expect, it } from 'vitest';

import { normalizeScene } from './normalize';
import {
  applyTemplateVariables,
  extractVariableKeys,
  formatVariableToken,
  listVariableUsages,
  rewriteVariableKeyInScene,
  validateVariableKeyForCatalog,
  wrapVariableTokensForDisplay,
} from './template-variables';

function emailArtboard(nodes: unknown[]) {
  return {
    extensions: { layout: 'email' },
    id: 'p1',
    name: 'Email',
    nodes,
    space: {},
  };
}

describe('template-variables', () => {
  it('substitutes known keys and escapes HTML in values', () => {
    const scene = normalizeScene({
      artboards: [
        emailArtboard([
          {
            id: 't1',
            props: { html: '<p>Hi {{{name}}}</p>' },
            type: 'email.text',
          },
        ]),
      ],
      variables: [{ id: 'v1', key: 'name' }],
    });
    const resolved = applyTemplateVariables(scene, {
      name: '<b>Ada</b>',
    });
    expect(resolved.artboards[0]!.nodes[0]!.props).toMatchObject({
      html: '<p>Hi &lt;b&gt;Ada&lt;/b&gt;</p>',
    });
  });

  it('does not escape plain-text label fields', () => {
    const scene = normalizeScene({
      artboards: [
        emailArtboard([
          {
            id: 'b1',
            props: { label: '{{{cta}}}' },
            type: 'email.button',
          },
        ]),
      ],
      variables: [{ id: 'v1', key: 'cta' }],
    });
    const resolved = applyTemplateVariables(scene, { cta: 'Tom & Jerry' });
    expect(resolved.artboards[0]!.nodes[0]!.props).toMatchObject({
      label: 'Tom & Jerry',
    });
  });

  it('leaves unknown tokens intact', () => {
    const scene = normalizeScene({
      artboards: [
        emailArtboard([
          {
            id: 't1',
            props: { html: '{{{missing}}}' },
            type: 'email.text',
          },
        ]),
      ],
    });
    const resolved = applyTemplateVariables(scene, { other: 'x' });
    expect(resolved.artboards[0]!.nodes[0]!.props).toMatchObject({
      html: '{{{missing}}}',
    });
  });

  it('extracts keys and rewrites on catalog rename', () => {
    expect(extractVariableKeys('{{{test}}} and {{{other}}}')).toEqual([
      'test',
      'other',
    ]);
    const scene = normalizeScene({
      artboards: [
        emailArtboard([
          {
            id: 't1',
            props: { html: formatVariableToken('old') },
            type: 'email.text',
          },
        ]),
      ],
      variables: [{ id: 'v1', key: 'old' }],
    });
    const rewritten = rewriteVariableKeyInScene(scene, 'old', 'new');
    expect(rewritten.artboards[0]!.nodes[0]!.props).toMatchObject({
      html: formatVariableToken('new'),
    });
    expect(listVariableUsages(rewritten)).toEqual(['new']);
  });

  it('validates catalog keys', () => {
    expect(validateVariableKeyForCatalog([], 'valid_key').ok).toBe(true);
    expect(validateVariableKeyForCatalog([], '9bad').ok).toBe(false);
  });

  it('wraps variable tokens for display', () => {
    const html = wrapVariableTokensForDisplay(
      '<p>{{{name}}}</p>',
      [{ id: 'v1', key: 'name', sample: 'Ada' }]
    );
    expect(html).toContain('openenvx-variable-chip');
    expect(html).toContain('{{{name}}}');
  });
});
