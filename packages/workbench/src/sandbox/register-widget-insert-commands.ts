import {
  Command,
  getActivePage,
  insertLayerIntoContainer,
  extensionBlockStore,
  type SandboxHostSurface,
} from '@openenvx/core';
import {
  createDefaultTransform,
  type Layer,
  type Page,
} from '@openenvx/core/schema';
import type {
  ExtensionManifest,
  ExtensionWidgetContribution,
} from '@xmazu/openenvxee-extensions/protocol';

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
function findHtmlLikeRootId(page: Page): string | null {
  if (page.layout !== 'html') {
    return null;
  }
  return (
    page.layers.find((layer) => layer.type === 'html.root')?.id ??
    page.layers.find(
      (layer) => layer.type.endsWith('.root') && layer.type !== 'email.root'
    )?.id ??
    null
  );
}

/**
 * Register host Commands that drop widget layers for each widgets/blocks
 * contribution. Command id is `${widget.id}.insert`. Outer-world path - no
 * internal Plugin. HTML pages nest under the page `*.root`; canvas pages append to
 * page.layers. `contributes.blocks` also register in {@link extensionBlockStore}
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
            const layer: Layer = {
              id: `${widget.id}-${Date.now()}`,
              type: widgetLayerType,
              name: widget.label || widget.id,
              transform: {
                ...createDefaultTransform(),
                x: 40,
                y: 40,
                width: size.width,
                height: size.height,
              },
              data: {
                extensionId: widget.id,
                label: widget.label,
                values: { ...values },
                children: [],
                manifest: {
                  id: widget.id,
                  label: widget.label,
                  kinds: widget.kinds,
                  fields: widget.fields ?? {},
                  defaults: values,
                },
              },
            };
            host.apply({
              label: title,
              apply: (scene) => {
                const selection = host.getSelection();
                const page = getActivePage(scene, selection.activePageId);
                const htmlRootId = findHtmlLikeRootId(page);
                return {
                  ...scene,
                  pages: scene.pages.map((entry) => {
                    if (entry.id !== page.id) {
                      return entry;
                    }
                    if (htmlRootId) {
                      return {
                        ...entry,
                        layers: insertLayerIntoContainer(
                          entry.layers,
                          htmlRootId,
                          layer
                        ),
                      };
                    }
                    return { ...entry, layers: [...entry.layers, layer] };
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
