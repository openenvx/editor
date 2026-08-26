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

describe('template-variables', () => {
  it('substitutes known keys and escapes HTML in values', () => {
    const scene = normalizeScene({
      pages: [
        {
          id: 'p1',
          layout: 'email',
          layers: [
            {
              id: 't1',
              type: 'email.text',
              data: { html: '<p>Hi {{{name}}}</p>' },
            },
          ],
        },
      ],
      variables: [{ id: 'v1', key: 'name' }],
    });
    const resolved = applyTemplateVariables(scene, {
      name: '<b>Ada</b>',
    });
    expect(resolved.pages[0]!.layers[0]!.data).toMatchObject({
      html: '<p>Hi &lt;b&gt;Ada&lt;/b&gt;</p>',
    });
  });

  it('does not escape plain-text label fields', () => {
    const scene = normalizeScene({
      pages: [
        {
          id: 'p1',
          layout: 'email',
          layers: [
            {
              id: 'b1',
              type: 'email.button',
              data: { label: '{{{cta}}}' },
            },
          ],
        },
      ],
      variables: [{ id: 'v1', key: 'cta' }],
    });
    const resolved = applyTemplateVariables(scene, { cta: 'Tom & Jerry' });
    expect(resolved.pages[0]!.layers[0]!.data).toMatchObject({
      label: 'Tom & Jerry',
    });
  });

  it('leaves unknown tokens intact', () => {
    const scene = normalizeScene({
      pages: [
        {
          id: 'p1',
          layout: 'email',
          layers: [
            {
              id: 't1',
              type: 'email.text',
              data: { html: '{{{missing}}}' },
            },
          ],
        },
      ],
    });
    const resolved = applyTemplateVariables(scene, { other: 'x' });
    expect(resolved.pages[0]!.layers[0]!.data).toMatchObject({
      html: '{{{missing}}}',
    });
  });

  it('extracts keys and rewrites on catalog rename', () => {
    expect(extractVariableKeys('{{{test}}} and {{{other}}}')).toEqual([
      'test',
      'other',
    ]);
    const scene = normalizeScene({
      pages: [
        {
          id: 'p1',
          layout: 'email',
          layers: [
            {
              id: 't1',
              type: 'email.text',
              data: { html: formatVariableToken('old') },
            },
          ],
        },
      ],
    });
    const rewritten = rewriteVariableKeyInScene(scene, 'old', 'new');
    expect(rewritten.pages[0]!.layers[0]!.data).toMatchObject({
      html: formatVariableToken('new'),
    });
    expect(listVariableUsages(rewritten)).toEqual(['new']);
  });

  it('validates catalog keys', () => {
    const variables = [{ id: 'v1', key: 'name' }];
    expect(validateVariableKeyForCatalog(variables, 'other')).toEqual({
      ok: true,
    });
    expect(validateVariableKeyForCatalog(variables, 'name')).toEqual({
      ok: false,
      reason: 'duplicate',
    });
    expect(validateVariableKeyForCatalog(variables, '1bad')).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(validateVariableKeyForCatalog(variables, 'name', 'v1')).toEqual({
      ok: true,
    });
  });

  it('wrapVariableTokensForDisplay adds chip spans without mutating tokens', () => {
    const html = '<p>Hi {{{name}}} and {{{missing}}}</p>';
    const wrapped = wrapVariableTokensForDisplay(
      html,
      [
        { id: 'v1', key: 'name', sample: 'Ada' },
        { id: 'v2', key: 'missing' },
      ],
      { missingTip: 'Add fallback' }
    );
    expect(wrapped).toContain('class="openenvx-variable-chip">');
    expect(wrapped).toContain('openenvx-variable-chip--missing');
    expect(wrapped).toContain('Add fallback');
    expect(wrapped).toContain('{{{name}}}');
    expect(wrapped).toContain('{{{missing}}}');
  });
});
