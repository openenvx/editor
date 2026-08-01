import type { ContributionBuildContext, CommandContext } from '@openenvx/core';
import {
  validatePluginTree,
  type PluginNode,
  type PluginPanelManifest,
} from '@xmazu/openenvxee-protocol';

import type { CommandPaletteBuilder } from '../builders/command-palette-builder';
import type { MenuBuilder } from '../builders/menu-builder';
import type { StatusBarBuilder } from '../builders/status-bar-builder';
import type { ToolbarBuilder } from '../builders/toolbar-builder';
import { CommandPaletteContribution } from '../contributions/command-palette-contribution';
import { ContextMenuContribution } from '../contributions/context-menu-contribution';
import { StatusBarContribution } from '../contributions/status-bar-contribution';
import { ToolbarContribution } from '../contributions/toolbar-contribution';
import type { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { contributePluginTreeToMenu } from './map-plugin-tree-to-menu';
import { contributePluginTreeToPalette } from './map-plugin-tree-to-palette';
import { contributePluginTreeToStatusBar } from './map-plugin-tree-to-status-bar';
import { contributePluginTreeToToolbar } from './map-plugin-tree-to-toolbar';
import { safeContribute } from './plugin-tree-helpers';

export type CreateManifestContributionsResult =
  | { ok: true; contributions: WorkbenchContribution[] }
  | { ok: false; reason: string };

export interface CreateManifestContributionsOptions {
  allowedCommands: readonly string[];
}

type ManifestSurface = 'menu' | 'toolbar' | 'statusBar' | 'palette';

const ROOT_TYPE: Record<ManifestSurface, string> = {
  menu: 'Menu',
  toolbar: 'Toolbar',
  statusBar: 'StatusBar',
  palette: 'Palette',
};

function validateManifestTree(
  surface: ManifestSurface,
  tree: unknown
): { ok: true; root: PluginNode } | { ok: false; reason: string } {
  const validated = validatePluginTree(tree);
  if (!validated.ok) {
    return { ok: false, reason: `${surface}: ${validated.reason}` };
  }
  const expected = ROOT_TYPE[surface];
  if (validated.root.type !== expected) {
    return {
      ok: false,
      reason: `${surface}: expected ${expected} root, got ${validated.root.type}`,
    };
  }
  return { ok: true, root: validated.root };
}

/**
 * Turn static chrome trees (from `ExtensionManifest.contributes.chrome` /
 * `PluginPanelManifest`) into workbench contributions that drive the existing
 * builders (same path as internal plugins).
 *
 * Trees are validated up front. Command ids are filtered through
 * `allowedCommands`. Contribute failures are swallowed so chrome rebuild cannot
 * be taken down by a bad tree.
 */
export function createManifestContributions(
  manifest: PluginPanelManifest,
  options: CreateManifestContributionsOptions
): CreateManifestContributionsResult {
  if (typeof manifest !== 'object' || manifest === null) {
    return { ok: false, reason: 'manifest must be an object' };
  }

  // Empty allowlist = no filter (same as palette). Non-empty Set gates command ids.
  const allowed =
    options.allowedCommands.length > 0
      ? new Set(options.allowedCommands)
      : undefined;
  const contributions: WorkbenchContribution[] = [];

  const entries: {
    surface: ManifestSurface;
    tree: PluginNode | undefined;
    create: (tree: PluginNode) => WorkbenchContribution;
  }[] = [
    {
      surface: 'menu',
      tree: manifest.menu as PluginNode | undefined,
      create: (tree) =>
        new (class extends ContextMenuContribution {
          contribute(builder: MenuBuilder, _ctx: ContributionBuildContext) {
            safeContribute(() =>
              contributePluginTreeToMenu(tree, builder, allowed)
            );
          }
        })(),
    },
    {
      surface: 'toolbar',
      tree: manifest.toolbar as PluginNode | undefined,
      create: (tree) =>
        new (class extends ToolbarContribution {
          contribute(builder: ToolbarBuilder, _ctx: CommandContext) {
            safeContribute(() =>
              contributePluginTreeToToolbar(tree, builder, allowed)
            );
          }
        })(),
    },
    {
      surface: 'statusBar',
      tree: manifest.statusBar as PluginNode | undefined,
      create: (tree) =>
        new (class extends StatusBarContribution {
          contribute(builder: StatusBarBuilder, _ctx: CommandContext) {
            safeContribute(() =>
              contributePluginTreeToStatusBar(tree, builder, allowed)
            );
          }
        })(),
    },
    {
      surface: 'palette',
      tree: manifest.palette as PluginNode | undefined,
      create: (tree) =>
        new (class extends CommandPaletteContribution {
          contribute(
            builder: CommandPaletteBuilder,
            _ctx: ContributionBuildContext
          ) {
            safeContribute(() =>
              contributePluginTreeToPalette(tree, builder, allowed)
            );
          }
        })(),
    },
  ];

  for (const entry of entries) {
    if (!entry.tree) {
      continue;
    }
    const validated = validateManifestTree(entry.surface, entry.tree);
    if (!validated.ok) {
      return validated;
    }
    contributions.push(entry.create(validated.root));
  }

  return { ok: true, contributions };
}
