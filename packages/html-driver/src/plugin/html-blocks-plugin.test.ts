import { AssetServiceId } from '@openenvx/core';
import { afterEach, describe, expect, it } from 'vitest';

import { builtinBlocks } from '../blocks/builtin-blocks';
import { defaultBlockRegistry } from '../block-registry';
import { HTML_BLOCKS_PANEL_COMPONENT_ID } from '../contributions/html-blocks-sidebar';
import { createHtmlWorkbench } from '../test/html-editor-harness';

describe('HtmlBlocksPlugin', () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
  });

  it('registers commands, block catalog, view panel, and editor pane', async () => {
    const harness = await createHtmlWorkbench();
    dispose = harness.dispose;
    const { api, controller } = harness;
    const state = controller.getState();

    for (const id of [
      'html.insertBlock',
      'html.moveBlock',
      'html.moveBlockUp',
      'html.moveBlockDown',
      'html.duplicateBlock',
      'html.updateBlockData',
      'html.removeBlock',
    ]) {
      expect(api.commands.get(id)).toBeTruthy();
    }

    for (const block of builtinBlocks) {
      expect(defaultBlockRegistry.get(block.type)?.type).toBe(block.type);
    }

    expect(
      state.viewPanels.some(
        (panel) => panel.id === HTML_BLOCKS_PANEL_COMPONENT_ID
      )
    ).toBe(true);
    expect(
      state.editorPanes.some((pane) => pane.editorPaneKind === 'html')
    ).toBe(true);
    expect(state.editorPaneKind).toBe('html');

    const assets = api.getService(AssetServiceId);
    expect(assets).toBeTruthy();
    expect(typeof assets?.upload).toBe('function');
  });
});
