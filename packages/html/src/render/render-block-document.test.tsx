import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BlockRegistry } from '../block-registry';
import { builtinBlocks } from '../blocks/builtin-blocks';
import { createHtmlDemoScene } from '../create-html-demo-scene';
import { renderBlockDocument } from './render-block-document';

describe('renderBlockDocument', () => {
  it('renders the demo HTML scene via block configs', () => {
    const registry = new BlockRegistry();
    for (const block of builtinBlocks) {
      registry.register(block);
    }
    const scene = createHtmlDemoScene();
    const page = scene.pages[0]!;

    const markup = renderToStaticMarkup(
      renderBlockDocument(page, registry)
    );

    expect(markup).toContain('Welcome');
    expect(markup).toContain('placehold.co');
  });

  it('applies per-type overrides and resolveAssetUrl', () => {
    const registry = new BlockRegistry();
    for (const block of builtinBlocks) {
      registry.register(block);
    }
    const scene = createHtmlDemoScene();
    const page = scene.pages[0]!;

    const markup = renderToStaticMarkup(
      renderBlockDocument(page, registry, {
        overrides: {
          'html.hero': ({ data }) => (
            <div data-override="hero">{String(data.backgroundImage ?? '')}</div>
          ),
        },
        resolveAssetUrl: (ref) =>
          ref.startsWith('https://') ? `${ref}?cdn=1` : ref,
      })
    );

    expect(markup).toContain('data-override="hero"');
    expect(markup).toContain('placehold.co/1200x600?cdn=1');
  });
});
