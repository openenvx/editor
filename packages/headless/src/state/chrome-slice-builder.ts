import { createContributionBuildContext } from '@openenvx/core';

import {
  buildCommandPalette,
  createCommandPaletteBuilder,
} from '../builders/command-palette-builder';
import {
  createMenuBuilder,
  filterMenuByWhen,
  mergeMenuContributions,
} from '../builders/menu-builder';
import { createStatusBarBuilder } from '../builders/status-bar-builder';
import { createToolbarBuilder } from '../builders/toolbar-builder';
import type { ChromeSlice } from '../workbench-state-cache';
import type { WorkbenchSliceContext } from './workbench-slice-context';

export function buildChromeSlice(ctx: WorkbenchSliceContext): ChromeSlice {
  const coreRegistries = ctx.manager.getRegistries();
  const workbenchRegistries = ctx.workbenchRegistries;
  const commandCtx = ctx.manager.createCommandContext();
  const canExecuteCommand = (commandId: string) =>
    coreRegistries.commands.canExecute(commandId, commandCtx);
  const buildCtx = createContributionBuildContext(
    commandCtx.services,
    canExecuteCommand
  );
  const contextKeyService = ctx.manager.getContextKeys();
  const evaluateWhen = (when: string | undefined) =>
    contextKeyService.evaluate(when);

  const contextMenu = filterMenuByWhen(
    mergeMenuContributions(
      workbenchRegistries.contextMenus.map((m) => {
        const b = createMenuBuilder();
        m.contribute(b, buildCtx);
        return b.build();
      })
    ),
    evaluateWhen
  );

  const commandPalette = buildCommandPalette(
    coreRegistries.commands.getAll().map((command) => command.id),
    workbenchRegistries.commandPalette.map((contribution) => {
      const builder = createCommandPaletteBuilder();
      contribution.contribute(builder, buildCtx);
      return builder.build();
    }),
    evaluateWhen,
    buildCtx.t
  );

  const overlays = workbenchRegistries.overlays.map((o) => o.getOverlay());

  const statusBarBuilder = createStatusBarBuilder();
  for (const contribution of workbenchRegistries.statusBars) {
    contribution.contribute(statusBarBuilder, commandCtx);
  }
  const statusBar = statusBarBuilder
    .build()
    .filter((item) => evaluateWhen(item.when))
    .toSorted((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  const statusBarItemRenderers =
    ctx.providerRegistries.statusBarItemRendererRegistry
      .entries()
      .map(([kind, Component]) => ({
        Component,
        kind,
      }));

  const toolbarBuilder = createToolbarBuilder();
  for (const contribution of workbenchRegistries.toolbars) {
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
