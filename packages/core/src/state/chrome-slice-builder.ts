import { createContributionBuildContext } from '../backbone';
import {
  buildCommandPalette,
  createCommandPaletteBuilder,
} from '../builders/command-palette-builder';
import {
  createMenuBuilder,
  filterMenuByCanExecute,
  filterMenuByWhen,
  mergeMenuContributions,
} from '../builders/menu-builder';
import { createSidebarHeaderBuilder } from '../builders/sidebar-header-builder';
import type { SidebarHeaderDescriptor } from '../builders/sidebar-header-builder';
import { createStatusBarBuilder } from '../builders/status-bar-builder';
import { createToolbarBuilder } from '../builders/toolbar-builder';
import type { TopBarContribution } from '../contributions/top-bar-contribution';
import type { TopBarRegistration } from '../workbench/top-bar-registration';
import type { ChromeSlice } from '../workbench/workbench-state-cache';
import type { WorkbenchSliceContext } from './workbench-slice-context';

function buildSidebarHeaders(
  contributions: {
    containerId: string;
    priority?: number;
    contribute: (
      builder: ReturnType<typeof createSidebarHeaderBuilder>,
      ctx: ReturnType<typeof createContributionBuildContext>
    ) => void;
  }[],
  buildCtx: ReturnType<typeof createContributionBuildContext>,
  evaluateWhen: (when: string | undefined) => boolean
): Record<string, SidebarHeaderDescriptor> {
  const winners = new Map<string, SidebarHeaderDescriptor>();
  const ordered = [...contributions].toSorted(
    (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
  );

  for (const contribution of ordered) {
    if (winners.has(contribution.containerId)) {
      continue;
    }
    const builder = createSidebarHeaderBuilder();
    contribution.contribute(builder, buildCtx);
    const descriptor = builder.build(
      contribution.containerId,
      contribution.priority ?? 0
    );
    descriptor.actions = descriptor.actions.filter((action) =>
      evaluateWhen(action.when)
    );
    if (descriptor.menuItems) {
      descriptor.menuItems = filterMenuByCanExecute(
        filterMenuByWhen(descriptor.menuItems, evaluateWhen),
        buildCtx.canExecute
      );
    }
    winners.set(contribution.containerId, descriptor);
  }

  return Object.fromEntries(winners);
}

function buildTopBars(
  contributions: TopBarContribution[],
  getComponent: (id: string) => unknown | undefined,
  evaluateWhen: (when: string | undefined) => boolean
): TopBarRegistration[] {
  let winner: TopBarContribution | undefined;
  for (const contribution of contributions) {
    if (!evaluateWhen(contribution.when)) {
      continue;
    }
    if (!winner || (contribution.priority ?? 0) >= (winner.priority ?? 0)) {
      winner = contribution;
    }
  }
  if (!winner) {
    return [];
  }
  const Component = getComponent(winner.id);
  if (!Component) {
    return [];
  }
  return [{ Component, id: winner.id }];
}

export function buildChromeSlice(ctx: WorkbenchSliceContext): ChromeSlice {
  const coreRegistries = ctx.coreRegistries;
  const workbenchRegistries = ctx.workbenchRegistries;
  const commandCtx = ctx.runtime.createCommandContext();
  const canExecuteCommand = (commandId: string) =>
    coreRegistries.commands.canExecute(commandId, commandCtx);
  const buildCtx = createContributionBuildContext(
    commandCtx.services,
    canExecuteCommand
  );
  const contextKeyService = ctx.runtime.getContextKeys();
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

  const sidebarHeaders = buildSidebarHeaders(
    workbenchRegistries.sidebarHeaders,
    buildCtx,
    evaluateWhen
  );

  const topBars = buildTopBars(
    workbenchRegistries.topBars,
    (id) => ctx.providerRegistries.topBarRegistry.get(id),
    evaluateWhen
  );

  return {
    commandPalette,
    contextKeys: contextKeyService.snapshot(),
    contextMenu,
    overlays,
    sidebarHeaders,
    statusBar,
    statusBarItemRenderers,
    toolbarItems,
    topBars,
  };
}
