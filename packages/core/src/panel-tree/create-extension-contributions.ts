import {
  validateExtensionManifest,
  type ExtensionManifest,
  type SandboxCapability,
  type SandboxExtensionGrant,
} from '@xmazu/openenvxee-extensions/protocol';

import type { ContributionBuildContext } from '../backbone';
import type { CommandPaletteBuilder } from '../builders/command-palette-builder';
import { CommandPaletteContribution } from '../contributions/command-palette-contribution';
import {
  ViewContainerContribution,
  ViewContribution,
  type ViewContainerLocation,
} from '../contributions/view-contribution';
import { createPropertyPane } from '../properties/property-pane-builder';
import type { PropertyPaneDescriptor } from '../properties/property-pane-descriptor';
import type { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { createManifestContributions } from './create-manifest-contributions';
import { extensionSurfaceStore } from './extension-surface-store';
import { mapPluginTreeToPropertyPane } from './map-plugin-tree-to-property-pane';

export type CreateExtensionContributionsResult =
  | {
      ok: true;
      contributions: WorkbenchContribution[];
      manifest: ExtensionManifest;
    }
  | { ok: false; reason: string };

export interface CreateExtensionContributionsOptions {
  grant?: Pick<SandboxExtensionGrant, 'capabilities' | 'allowedCommands'>;
}

/** Effective capabilities = grant ∩ requested (or grant alone when no request). */
export function intersectExtensionPermissions(
  requested: readonly SandboxCapability[] | undefined,
  granted: readonly SandboxCapability[]
): SandboxCapability[] {
  if (!requested || requested.length === 0) {
    return [...granted];
  }
  const grantedSet = new Set(granted);
  return requested.filter((cap) => grantedSet.has(cap));
}

/**
 * Map a validated static extension manifest to workbench contributions.
 * Chrome reuses {@link createManifestContributions}. Views read bodies from
 * {@link extensionSurfaceStore} when a `render` message arrives.
 */
export function createExtensionContributions(
  input: unknown,
  options: CreateExtensionContributionsOptions = {}
): CreateExtensionContributionsResult {
  const validated = validateExtensionManifest(input);
  if (!validated.ok) {
    return validated;
  }
  const { manifest } = validated;
  const declaredCommandIds = (manifest.contributes.commands ?? []).map(
    (cmd) => cmd.id
  );
  // Grant ∩ declared: chrome may only surface commands the grant allows.
  // When no grant is provided (trusted static host), allow declared ids.
  const allowedCommands = options.grant
    ? declaredCommandIds.filter((id) =>
        (options.grant?.allowedCommands ?? []).includes(id)
      )
    : declaredCommandIds;

  if (options.grant && (manifest.permissions?.length ?? 0) > 0) {
    const effective = intersectExtensionPermissions(
      manifest.permissions,
      options.grant.capabilities
    );
    if (effective.length === 0) {
      return {
        ok: false,
        reason: 'Manifest permissions do not intersect grant capabilities',
      };
    }
  }

  const contributions: WorkbenchContribution[] = [];

  if (manifest.contributes.chrome) {
    const chrome = createManifestContributions(manifest.contributes.chrome, {
      allowedCommands,
    });
    if (!chrome.ok) {
      return chrome;
    }
    contributions.push(...chrome.contributions);
  }

  const commands = manifest.contributes.commands ?? [];
  if (commands.length > 0) {
    const filtered = commands.filter((cmd) => allowedCommands.includes(cmd.id));
    if (filtered.length > 0) {
      contributions.push(
        new (class extends CommandPaletteContribution {
          contribute(
            builder: CommandPaletteBuilder,
            _ctx: ContributionBuildContext
          ) {
            builder.category(manifest.id, manifest.name);
            for (const cmd of filtered) {
              builder.item(cmd.id).label(cmd.title).category(manifest.id);
            }
          }
        })()
      );
    }
  }

  for (const container of manifest.contributes.viewContainers ?? []) {
    const location: ViewContainerLocation =
      container.location === 'secondary' ? 'secondary' : 'primary';
    contributions.push(
      new (class extends ViewContainerContribution {
        readonly id = container.id;
        readonly title = container.title;
        icon = container.icon;
        defaultLocation = location;
      })()
    );
  }

  for (const view of manifest.contributes.views ?? []) {
    const title = view.title ?? view.id;
    contributions.push(
      new (class extends ViewContribution {
        readonly id = view.id;
        readonly containerId = view.container;
        readonly name = title;
        when = view.when;
        emptyMessage = `Waiting for ${title}…`;

        buildProperties(
          _ctx: ContributionBuildContext
        ): PropertyPaneDescriptor {
          const tree = extensionSurfaceStore.get(view.id);
          if (tree?.type === 'Pane') {
            return mapPluginTreeToPropertyPane(tree as never, {
              panelId: view.id,
            });
          }
          return createPropertyPane(view.id, title).build();
        }
      })()
    );
  }

  return { ok: true, contributions, manifest };
}
