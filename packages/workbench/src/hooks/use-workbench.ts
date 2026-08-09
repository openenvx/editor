import { WorkbenchController } from '@openenvx/core';
import type { WorkbenchApi, WorkbenchControllerOptions } from '@openenvx/core';
import { useRef, useState } from 'react';

import { useMountEffect } from './use-mount-effect';

export interface UseWorkbenchResult {
  controller: WorkbenchController | null;
  api: WorkbenchApi | null;
  ready: boolean;
}

export function useWorkbench(
  options: WorkbenchControllerOptions
): UseWorkbenchResult {
  const [ready, setReady] = useState(false);
  const controllerRef = useRef<WorkbenchController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useMountEffect(() => {
    const controller = new WorkbenchController(optionsRef.current);
    controllerRef.current = controller;
    let cancelled = false;

    controller.start().then(() => {
      if (!cancelled) {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      controller.dispose();
      controllerRef.current = null;
      setReady(false);
    };
  });

  return {
    api: ready && controllerRef.current ? controllerRef.current.api : null,
    controller: controllerRef.current,
    ready,
  };
}
