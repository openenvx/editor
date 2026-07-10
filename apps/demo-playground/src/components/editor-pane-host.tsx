import { AbsoluteEditorPane } from '@openenvx/canvas';
import { useWorkbenchContextSelector } from '@openenvx/headless/react';

export function EditorPaneHost() {
  const layerSurface = useWorkbenchContextSelector(
    (state) => state.layerSurface
  );

  if (!layerSurface) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AbsoluteEditorPane layerSurface={layerSurface} />
    </div>
  );
}
