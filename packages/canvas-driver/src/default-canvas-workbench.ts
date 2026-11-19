import {
  createEditorPlugins,
  type CreateEditorPluginsOptions,
} from '@openenvx/editor';
import type { DocumentSliceBuilders, Plugin } from '@openenvx/studio';

import { DEFAULT_CANVAS_LAYOUT } from './default-canvas-layout';
import { CanvasPlugin } from './plugin/canvas-plugin';
import { createCanvasPropertyHostContextWithApi } from './properties/create-canvas-property-host-context';
import { createCanvasScene } from './publish-runtime';

export type DefaultCanvasWorkbenchOptions = Pick<
  CreateEditorPluginsOptions,
  'document' | 'session' | 'editorUri' | 'editorTitle' | 'onDocumentChange'
>;

export function createDefaultCanvasWorkbench(
  options: DefaultCanvasWorkbenchOptions
) {
  const editor = createEditorPlugins(options);
  // Editor document services must register before canvas binds display context keys
  // (context changes refresh state and need DocumentStore during boot).
  const plugins: Plugin[] = [...editor.plugins, new CanvasPlugin()];
  return {
    plugins,
    sliceBuilders: editor.sliceBuilders as DocumentSliceBuilders,
    layout: DEFAULT_CANVAS_LAYOUT,
    createPropertyHostContext: createCanvasPropertyHostContextWithApi,
  };
}

/** Canvas scene with editor document plugins and slice builders. */
/** Default wiring for canvas hosts (empty artboard until host sets document). */
export const defaultCanvasWorkbench = createDefaultCanvasWorkbench({
  document: createCanvasScene(),
});
