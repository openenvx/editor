import { CanvasBasicsPlugin, createCanvasDemoScene } from '@openenvx/canvas';
import { DriverImagePlugin } from '@openenvx/driver-image';
import { WorkbenchController } from '@openenvx/headless';
import { useEffect, useState } from 'react';

import { PlaygroundExportPlugin } from './playground-export-plugin';

export function usePlaygroundController() {
  const [controller, setController] = useState<WorkbenchController | null>(
    null
  );

  useEffect(() => {
    const nextController = new WorkbenchController({
      initialScene: createCanvasDemoScene(),
      plugins: [
        new CanvasBasicsPlugin(),
        new DriverImagePlugin(),
        new PlaygroundExportPlugin(),
      ],
    });

    let cancelled = false;

    void nextController.start().then(() => {
      if (!cancelled) {
        setController(nextController);
      }
    });

    return () => {
      cancelled = true;
      nextController.dispose();
    };
  }, []);

  return controller;
}
