import { Command } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';
import type { Layer } from '@openenvx/core/schema';
import {
  createBlock,
  findBlock,
  getPageRootId,
  insertAt,
  mapPageLayers,
  type BlockRegistry,
} from '@openenvx/html';

import { EmailBlockRegistryServiceId } from '../block-registry';
import {
  clipboardHtmlToEmailLayers,
  type EmailPasteLayerSpec,
} from '../clipboard/html-to-email-layers';
import { resolvePasteInsertTarget } from '../clipboard/resolve-paste-insert-target';
import { EmailEditorModeServiceId } from '../editor/email-editor-mode-service';

function createBlockId(type: string): string {
  return `${type.replaceAll('.', '-')}-${crypto.randomUUID()}`;
}

function getEmailRegistry(ctx: CommandContext): BlockRegistry | null {
  if (!ctx.services.has(EmailBlockRegistryServiceId)) {
    return null;
  }
  return ctx.services.get(EmailBlockRegistryServiceId);
}

function isEmailEditMode(ctx: CommandContext): boolean {
  if (!ctx.services.has(EmailEditorModeServiceId)) {
    return true;
  }
  const modeService = ctx.services.get(EmailEditorModeServiceId);
  if (!modeService.isActive()) {
    return true;
  }
  return modeService.getMode() === 'edit';
}

function buildLayersFromSpecs(
  specs: EmailPasteLayerSpec[],
  registry: BlockRegistry
): Layer[] {
  const layers: Layer[] = [];
  for (const spec of specs) {
    const config = registry.get(spec.type);
    if (!config) {
      continue;
    }
    layers.push(
      createBlock(spec.type, createBlockId(spec.type), {
        ...config.defaultData,
        ...spec.data,
      })
    );
  }
  return layers;
}

function wrapInSection(
  children: Layer[],
  registry: BlockRegistry
): Layer | null {
  const sectionConfig = registry.get('email.section');
  if (!sectionConfig || children.length === 0) {
    return null;
  }
  return createBlock('email.section', createBlockId('email.section'), {
    ...sectionConfig.defaultData,
    children,
  });
}

function insertPastedLayers(
  layers: Layer[],
  target: { parentId: string; index: number; wrapInSection: boolean },
  pasted: Layer[],
  registry: BlockRegistry
): { layers: Layer[]; firstInsertedId: string | null } {
  if (pasted.length === 0) {
    return { firstInsertedId: null, layers };
  }

  if (target.wrapInSection) {
    const section = wrapInSection(pasted, registry);
    if (!section) {
      return { firstInsertedId: null, layers };
    }
    const firstChild = (
      (section.data as Record<string, unknown>).children as Layer[] | undefined
    )?.[0];
    return {
      firstInsertedId: firstChild?.id ?? section.id,
      layers: insertAt(layers, target.parentId, section, target.index),
    };
  }

  let next = layers;
  let insertIndex = target.index;
  let firstInsertedId: string | null = null;
  for (const block of pasted) {
    if (!firstInsertedId) {
      firstInsertedId = block.id;
    }
    next = insertAt(next, target.parentId, block, insertIndex);
    insertIndex += 1;
  }
  return { firstInsertedId, layers: next };
}

export class PasteFromClipboardCommand extends Command {
  readonly id = 'email.pasteFromClipboard';

  canExecute(ctx: CommandContext): boolean {
    return ctx.scene.getActivePage().layout === 'email' && isEmailEditMode(ctx);
  }

  execute(
    ctx: CommandContext,
    args?: { html?: string | null; plain?: string | null }
  ): void {
    if (!this.canExecute(ctx)) {
      return;
    }
    const registry = getEmailRegistry(ctx);
    if (!registry) {
      return;
    }

    const specs = clipboardHtmlToEmailLayers(
      args?.html ?? null,
      args?.plain ?? null
    );
    if (specs.length === 0) {
      return;
    }

    const page = ctx.scene.getActivePage();
    const rootId = getPageRootId(page, 'email.root');
    const selectedId =
      ctx.selection.primaryLayerId ?? ctx.selection.selectedLayerIds[0] ?? null;
    const target = resolvePasteInsertTarget(
      page.layers,
      selectedId,
      rootId,
      registry
    );
    if (!target) {
      return;
    }

    const parent = findBlock(page.layers, target.parentId);
    if (!parent && target.parentId !== rootId) {
      return;
    }

    const pasted = buildLayersFromSpecs(specs, registry);
    if (pasted.length === 0) {
      return;
    }

    const { layers: nextLayers, firstInsertedId } = insertPastedLayers(
      page.layers,
      target,
      pasted,
      registry
    );
    if (!firstInsertedId) {
      return;
    }

    ctx.scene.apply({
      apply: (scene) => mapPageLayers(scene, page.id, () => nextLayers),
      label: 'Paste from clipboard',
    });
    ctx.scene.selectLayers([firstInsertedId]);
  }
}

export function createEmailPasteCommand(): PasteFromClipboardCommand {
  return new PasteFromClipboardCommand();
}
