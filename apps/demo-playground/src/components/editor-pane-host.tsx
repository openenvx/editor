import { useWorkbenchContextSelector } from '@openenvx/headless/react';

import { AbsoluteEditorPane } from './absolute-editor-pane';

export function EditorPaneHost() {
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const layerSurface = useWorkbenchContextSelector(
    (state) => state.layerSurface
  );

  if (!scene || !selection || !layerSurface) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AbsoluteEditorPane
        layerSurface={layerSurface}
        scene={scene}
        selection={selection}
      />
    </div>
  );
}
