import {
  Command,
  getActiveArtboard,
  insertLayerIntoContainer,
} from '@openenvx/studio/core';
import {
  applyNodeTransform,
  artboardRulesLayout,
  createDefaultTransform,
  type Artboard,
  type DocumentNode,
} from '@openenvx/studio/schema';

import type {
  ExtensionManifest,
  ExtensionWidgetContribution,
} from '../protocol';
import { extensionBlockStore } from './panel-tree/extension-block-store';
import type { SandboxHostSurface } from './sandbox-host-surface';

function sizeFromDefaults(defaults: Record<string, unknown> | undefined): {
  width: number;
  height: number;
} {
  const width =
    typeof defaults?.width === 'number' && defaults.width > 0
      ? defaults.width
      : 200;
  const height =
    typeof defaults?.height === 'number' && defaults.height > 0
      ? defaults.height
      : 180;
  return { width, height };
}

function valuesFromDefaults(
  defaults: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!defaults) {
    return {};
  }
  const { width: _w, height: _h, ...rest } = defaults;
  return rest;
}

function insertCommandId(widget: ExtensionWidgetContribution): string {
  return `${widget.id}.insert`;
}

/**
 * Nest widgets under the page root for html-like layouts only.
 * Never under `email.root` (widgets do not round-trip through email render).
 */
function findHtmlLikeRootId(artboard: Artboard): string | null {
  if (artboardRulesLayout(artboard) !== 'html') {
    return null;
  }
  return (
    artboard.nodes.find((layer) => layer.type === 'html.root')?.id ??
    artboard.nodes.find(
      (layer) => layer.type.endsWith('.root') && layer.type !== 'email.root'
    )?.id ??
    null
  );
}

/**
 * Register host Commands that drop widget layers for each widgets/blocks
 * contribution. Command id is `${widget.id}.insert`. Outer-world path - no
 * internal Plugin. HTML artboards nest under the page `*.root`; canvas artboards append to
 * artboard.nodes. `contributes.blocks` also register in {@link extensionBlockStore}
 * for the HTML Blocks palette.
 */
export function registerWidgetInsertCommands(
  host: SandboxHostSurface,
  manifest: ExtensionManifest,
  widgetLayerType: string
): { dispose(): void }[] {
  const faces = [
    ...(manifest.contributes.widgets ?? []),
    ...(manifest.contributes.blocks ?? []),
  ];
  const commandTitles = new Map(
    (manifest.contributes.commands ?? []).map((cmd) => [cmd.id, cmd.title])
  );
  const disposables: { dispose(): void }[] = [];

  for (const widget of faces) {
    const commandId = insertCommandId(widget);
    const title =
      commandTitles.get(commandId) ?? `Insert ${widget.label || widget.id}`;
    const defaults = widget.defaults ?? {};
    const size = sizeFromDefaults(defaults);
    const values = valuesFromDefaults(defaults);

    disposables.push(
      host.registerCommand(
        new (class extends Command {
          readonly id = commandId;
          readonly title = title;
          execute(): void {
            const layer: DocumentNode = applyNodeTransform(
              {
                id: `${widget.id}-${Date.now()}`,
                type: widgetLayerType,
                name: widget.label || widget.id,
                props: {
                  extensionId: widget.id,
                  label: widget.label,
                  values: { ...values },
                  manifest: {
                    id: widget.id,
                    label: widget.label,
                    kinds: widget.kinds,
                    fields: widget.fields ?? {},
                    defaults: values,
                  },
                },
                children: [],
              },
              {
                ...createDefaultTransform(),
                opacity: 1,
                x: 40,
                y: 40,
                width: size.width,
                height: size.height,
              }
            );
            host.apply({
              label: title,
              apply: (scene) => {
                const selection = host.getSelection();
                const page = getActiveArtboard(
                  scene,
                  selection.activeArtboardId
                );
                const htmlRootId = findHtmlLikeRootId(page);
                return {
                  ...scene,
                  artboards: scene.artboards.map((entry) => {
                    if (entry.id !== page.id) {
                      return entry;
                    }
                    if (htmlRootId) {
                      return {
                        ...entry,
                        nodes: insertLayerIntoContainer(
                          entry.nodes,
                          htmlRootId,
                          layer
                        ),
                      };
                    }
                    return { ...entry, nodes: [...entry.nodes, layer] };
                  }),
                };
              },
            });
            host.selectLayers([layer.id], layer.id);
          }
        })()
      )
    );
  }

  for (const block of manifest.contributes.blocks ?? []) {
    disposables.push(
      extensionBlockStore.register({
        id: block.id,
        label: block.label || block.id,
        insertCommandId: insertCommandId(block),
      })
    );
  }

  return disposables;
}
