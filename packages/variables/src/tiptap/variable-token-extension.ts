import {
  resolveVariableChipPresentation,
  VARIABLE_TOKEN_CAPTURE_RE,
  type TemplateVariable,
} from '@openenvx/core/schema';
import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface VariableTokenCatalog {
  variables: TemplateVariable[];
  missingTip: string;
}

function buildVariableDecorations(
  doc: ProseMirrorNode,
  catalog: VariableTokenCatalog
): DecorationSet {
  if (!doc.textContent.includes('{{{')) {
    return DecorationSet.empty;
  }
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text?.includes('{{{')) {
      return;
    }
    const text = node.text;
    VARIABLE_TOKEN_CAPTURE_RE.lastIndex = 0;
    for (const match of text.matchAll(VARIABLE_TOKEN_CAPTURE_RE)) {
      const index = match.index ?? 0;
      const from = pos + index;
      const to = from + match[0].length;
      const key = match[1]!;
      const chip = resolveVariableChipPresentation(
        key,
        catalog.variables,
        catalog.missingTip
      );
      const attrs: Record<string, string> = { class: chip.className };
      if (chip.title) {
        attrs.title = chip.title;
      }
      decorations.push(Decoration.inline(from, to, attrs));
    }
  });

  return decorations.length > 0
    ? DecorationSet.create(doc, decorations)
    : DecorationSet.empty;
}

export function createVariableTokenExtension(
  getCatalog: () => VariableTokenCatalog
) {
  return Extension.create({
    name: 'variableToken',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('variableTokenDecorations'),
          props: {
            decorations(state) {
              return buildVariableDecorations(state.doc, getCatalog());
            },
          },
        }),
      ];
    },
  });
}
