import { WorkbenchController, type WorkbenchApi } from '@openenvx/core';
import { WorkbenchProvider } from '@openenvx/core/react';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { createEmailDemoScene } from '../create-email-demo-scene';
import { EmailBlocksPlugin } from '../plugin/email-blocks-plugin';

export async function createEmailWorkbench(): Promise<{
  api: WorkbenchApi;
  controller: WorkbenchController;
  dispose: () => void;
}> {
  const controller = new WorkbenchController({
    initialScene: createEmailDemoScene(),
    plugins: [new EmailBlocksPlugin()],
  });
  await controller.start();
  return {
    api: controller.api,
    controller,
    dispose: () => controller.dispose(),
  };
}

export function renderWithEmailWorkbench(
  api: WorkbenchApi,
  ui: ReactElement
): ReturnType<typeof render> {
  function Wrapper({ children }: { children: ReactNode }) {
    return <WorkbenchProvider api={api}>{children}</WorkbenchProvider>;
  }
  return render(ui, { wrapper: Wrapper });
}
