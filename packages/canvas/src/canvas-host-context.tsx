import type { ServiceId } from '@openenvx/core';
import { createContext, useContext, type ReactNode } from 'react';

export interface CanvasHostApi {
  executeCommand(
    commandId: string,
    args?: Record<string, unknown>
  ): Promise<boolean>;
  getService<T>(token: ServiceId<T>): T | undefined;
  runCommand<T = unknown>(
    commandId: string,
    args?: Record<string, unknown>
  ): Promise<{ executed: boolean; result?: T }>;
  updateProperty(layerId: string, key: string, value: unknown): void;
  selectLayers(layerIds: string[], primaryLayerId: string | null): void;
  setContextKey(key: string, value: boolean | string | number): void;
}

const CanvasHostContext = createContext<CanvasHostApi | null>(null);

export function CanvasHostProvider({
  host,
  children,
}: {
  host: CanvasHostApi;
  children: ReactNode;
}) {
  return (
    <CanvasHostContext.Provider value={host}>
      {children}
    </CanvasHostContext.Provider>
  );
}

export function useCanvasHost(): CanvasHostApi {
  const host = useContext(CanvasHostContext);
  if (!host) {
    throw new Error('useCanvasHost must be used within CanvasHostProvider');
  }
  return host;
}
