import {
  buildCommandPalette,
  createCommandPaletteBuilder,
  createContributionBuildContext,
  createMenuBuilder,
  createStatusBarBuilder,
  createToolbarBuilder,
  filterMenuByWhen,
  mergeMenuContributions,
} from '@openenvx/core';

import type { ChromeSlice } from '../workbench-state-cache';
import type { WorkbenchSliceContext } from './workbench-slice-context';

export function buildChromeSlice(ctx: WorkbenchSliceContext): ChromeSlice {
  const registries = ctx.manager.getRegistries();
  const commandCtx = ctx.manager.createCommandContext();
  const canExecuteCommand = (commandId: string) =>
    registries.commands.canExecute(commandId, commandCtx);
  const buildCtx = createContributionBuildContext(
    commandCtx.services,
    canExecuteCommand
  );
  const contextKeyService = ctx.manager.getContextKeys();
  const evaluateWhen = (when: string | undefined) =>
    contextKeyService.evaluate(when);

  const contextMenu = filterMenuByWhen(
    mergeMenuContributions(
      registries.contextMenus.map((m) => {
        const b = createMenuBuilder();
        m.contribute(b, buildCtx);
        return b.build();
      })
    ),
    evaluateWhen
  );

  const commandPalette = buildCommandPalette(
    registries.commands.getAll().map((command) => command.id),
    registries.commandPalette.map((contribution) => {
      const builder = createCommandPaletteBuilder();
      contribution.contribute(builder, buildCtx);
      return builder.build();
    }),
    evaluateWhen,
    buildCtx.t
  );

  const overlays = registries.overlays.map((o) => o.getOverlay());

  const statusBarBuilder = createStatusBarBuilder();
  for (const contribution of registries.statusBars) {
    contribution.contribute(statusBarBuilder, commandCtx);
  }
  const statusBar = statusBarBuilder
    .build()
    .filter((item) => evaluateWhen(item.when))
    .toSorted((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  const statusBarItemRenderers = registries.statusBarItemRenderers.map(
    (renderer) => ({
      Component: renderer.Component,
      kind: renderer.kind,
    })
  );

  const toolbarBuilder = createToolbarBuilder();
  for (const contribution of registries.toolbars) {
    contribution.contribute(toolbarBuilder, commandCtx);
  }
  const toolbarItems = toolbarBuilder
    .build()
    .filter((item) => evaluateWhen(item.when))
    .toSorted((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  return {
    commandPalette,
    contextKeys: contextKeyService.snapshot(),
    contextMenu,
    overlays,
    statusBar,
    statusBarItemRenderers,
    toolbarItems,
  };
}
