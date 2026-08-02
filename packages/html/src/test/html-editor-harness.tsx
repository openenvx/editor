import {
  EditorRuntime,
  EditorService,
  PluginManager,
  SceneStore,
  SimpleServiceContribution,
  type Selection,
} from '@openenvx/core';
import { WorkbenchController } from '@openenvx/headless';
import type { WorkbenchApi } from '@openenvx/headless';
import { WorkbenchProvider } from '@openenvx/headless/react';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';

import { BlockRegistry, BlockRegistryServiceId } from '../block-registry';
import { builtinBlocks } from '../blocks/builtin-blocks';
import { createBlockCommands } from '../commands/create-block-commands';
import { createHtmlDemoScene } from '../create-html-demo-scene';
import type { BlockSortDraft } from '../editor/block-dnd';
import { HtmlBlocksPlugin } from '../plugin/html-blocks-plugin';

export const htmlDemoSelection: Selection = {
  activePageId: 'html-page',
  primaryLayerId: null,
  selectedLayerIds: [],
};

export function createSortDraftMock(options?: {
  passCurrentToUpdater?: boolean;
  initial?: BlockSortDraft | null;
}) {
  const sortDraftRef: { current: BlockSortDraft | null } = {
    current: options?.initial ?? null,
  };
  const passCurrent = options?.passCurrentToUpdater ?? false;
  const setSortDraft = vi.fn((update) => {
    const base = passCurrent ? sortDraftRef.current : null;
    const value = typeof update === 'function' ? update(base) : update;
    sortDraftRef.current = value;
    return value;
  });
  return { sortDraftRef, setSortDraft };
}

export function createBlockRegistry(): BlockRegistry {
  const registry = new BlockRegistry();
  for (const block of builtinBlocks) {
    registry.register(block);
  }
  return registry;
}

/** Lightweight command harness (no workbench chrome). */
export function createHtmlCommandHarness() {
  const registry = createBlockRegistry();
  const store = new SceneStore(createHtmlDemoScene());
  const runtime = new EditorRuntime(store, new EditorService());
  const manager = new PluginManager(runtime);
  manager.createPluginContext().register(
    new SimpleServiceContribution(BlockRegistryServiceId, () => registry),
    ...createBlockCommands({
      prefix: 'html',
      rootType: 'html.root',
      registryServiceId: BlockRegistryServiceId,
    })
  );
  return { manager, registry, runtime, store };
}

export async function createHtmlWorkbench(): Promise<{
  api: WorkbenchApi;
  controller: WorkbenchController;
  dispose: () => void;
}> {
  const controller = new WorkbenchController({
    initialScene: createHtmlDemoScene(),
    plugins: [new HtmlBlocksPlugin()],
  });
  await controller.start();
  return {
    api: controller.api,
    controller,
    dispose: () => controller.dispose(),
  };
}

export function renderWithWorkbench(
  api: WorkbenchApi,
  ui: ReactElement
): ReturnType<typeof render> {
  function Wrapper({ children }: { children: ReactNode }) {
    return <WorkbenchProvider api={api}>{children}</WorkbenchProvider>;
  }
  return render(ui, { wrapper: Wrapper });
}
