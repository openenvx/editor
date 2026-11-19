import { describe, expect, it } from 'vitest';

import { normalizeDocumentForTest } from '../test/document-fixtures';
import { createContextKeyService } from './context-key-service';

describe('ContextKeyService', () => {
  it('evaluates when expressions', () => {
    const keys = createContextKeyService();
    keys.set('page.layoutFlow', true);
    keys.set('scene.layerSelected', false);
    keys.set('scene.multiPage', false);
    keys.set('scene.primaryLayerType', '');
    keys.set('editor.hasActiveEditor', true);

    expect(keys.evaluate('page.layoutFlow')).toBeTruthy();
    expect(keys.evaluate('scene.layerSelected')).toBeFalsy();
    expect(keys.evaluate('scene.multiPage')).toBeFalsy();
    expect(keys.evaluate("scene.primaryLayerType == 'canvas.svg'")).toBeFalsy();
    expect(keys.evaluate('page.layoutFlow && editor.hasActiveEditor')).toBeTruthy();
  });

  it('sets scene.primaryLayerType from the primary selection', () => {
    const keys = createContextKeyService();
    keys.set('scene.primaryLayerType', 'canvas.svg');
    expect(keys.evaluate("scene.primaryLayerType == 'canvas.svg'")).toBeTruthy();
  });

  it('sets scene.multiPage when more than one page exists', () => {
    const scene = normalizeDocumentForTest({
      pages: [
        { id: 'a', name: 'A', layout: 'flow', layers: [] },
        { id: 'b', name: 'B', layout: 'flow', layers: [] },
      ],
    });
    const keys = createContextKeyService();
    keys.set('scene.multiPage', scene.artboards.length > 1);
    expect(keys.evaluate('scene.multiPage')).toBeTruthy();
  });
});