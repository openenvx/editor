import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { builtinBlocks } from '../blocks/builtin-blocks';
import { defaultBlockRegistry } from '../block-registry';
import {
  createHtmlWorkbench,
  renderWithWorkbench,
} from '../test/html-editor-harness';
import { BlockPalettePanel } from './block-palette-panel';

afterEach(cleanup);

describe('BlockPalettePanel', () => {
  it('lists palette blocks and inserts on click', async () => {
    for (const block of builtinBlocks) {
      defaultBlockRegistry.register(block);
    }

    const { api, dispose } = await createHtmlWorkbench();
    try {
      const executeSpy = vi.spyOn(api, 'executeCommand');
      renderWithWorkbench(api, <BlockPalettePanel />);

      expect(screen.getByRole('button', { name: 'Heading' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Flex' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Page' })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Heading' }));
      expect(executeSpy).toHaveBeenCalledWith(
        'html.insertBlock',
        expect.objectContaining({
          type: 'html.heading',
          parentId: 'root',
        })
      );
    } finally {
      dispose();
    }
  });

  it('inserts under a leaf block parent when selection is a leaf', async () => {
    for (const block of builtinBlocks) {
      defaultBlockRegistry.register(block);
    }

    const { api, dispose } = await createHtmlWorkbench();
    try {
      api.selectLayers(['heading-1'], 'heading-1');
      const executeSpy = vi.spyOn(api, 'executeCommand');
      renderWithWorkbench(api, <BlockPalettePanel />);

      fireEvent.click(screen.getByRole('button', { name: 'Image' }));
      expect(executeSpy).toHaveBeenCalledWith(
        'html.insertBlock',
        expect.objectContaining({
          type: 'html.image',
          parentId: 'root',
        })
      );
    } finally {
      dispose();
    }
  });
});
