import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { emailBlockRegistry } from '../block-registry';
import { builtinEmailBlocks } from '../blocks/builtin-blocks';
import { emailPatternCatalog, headerBlock } from '../blocks/patterns';
import { renderPatternThumbnail } from './block-thumbnail';

describe('renderPatternThumbnail', () => {
  it('renders children-based pattern content (not empty Section chrome)', () => {
    for (const block of builtinEmailBlocks) {
      emailBlockRegistry.register(block);
    }
    for (const entry of emailPatternCatalog) {
      emailBlockRegistry.register(entry.block);
      for (const part of entry.parts ?? []) {
        emailBlockRegistry.register(part);
      }
    }

    const html = renderToStaticMarkup(
      <>{renderPatternThumbnail(headerBlock, emailBlockRegistry)}</>
    );

    expect(html).toContain('alt="Logo"');
    expect(html).toContain('About');
    expect(html).toContain('Blog');
  });
});
