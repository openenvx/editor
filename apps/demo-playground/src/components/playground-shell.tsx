import { WorkbenchProvider } from '@openenvx/core/react';

import { EditorPaneHost } from './editor-pane-host';
import { PlaygroundToolbar } from './playground-toolbar';
import { usePlaygroundController } from './use-playground-controller';

export function PlaygroundShell() {
  const controller = usePlaygroundController();

  if (!controller) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-neutral-500">
        Loading playground…
      </div>
    );
  }

  return (
    <WorkbenchProvider api={controller.api}>
      <div className="flex h-screen flex-col bg-neutral-100">
        <PlaygroundToolbar />
        <main className="flex min-h-0 flex-1 flex-col">
          <EditorPaneHost />
        </main>
      </div>
    </WorkbenchProvider>
  );
}
