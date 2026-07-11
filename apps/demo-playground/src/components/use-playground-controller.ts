import { CanvasBasicsPlugin, createCanvasDemoScene } from '@openenvx/canvas';
import { CanvasProPlugin } from '@openenvx/canvas-pro';
import { WorkbenchController } from '@openenvx/headless';
import { useEffect, useState } from 'react';

export function usePlaygroundController() {
  const [controller, setController] = useState<WorkbenchController | null>(
    null
  );

  useEffect(() => {
    const nextController = new WorkbenchController({
      initialScene: createCanvasDemoScene(),
      plugins: [new CanvasBasicsPlugin(), new CanvasProPlugin()],
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
