import { CanvasPlugin, createCanvasDemoScene } from '@openenvx/canvas';
import { WorkbenchController } from '@openenvx/core';
import { useEffect, useState } from 'react';

export function usePlaygroundController() {
  const [controller, setController] = useState<WorkbenchController | null>(
    null
  );

  useEffect(() => {
    const nextController = new WorkbenchController({
      initialScene: createCanvasDemoScene(),
      plugins: [new CanvasPlugin()],
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
