import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { WorkbenchApi } from '../workbench-controller';

export interface WorkbenchContextValue {
  api: WorkbenchApi;
  executeCommand: (commandId: string, args?: unknown) => Promise<boolean>;
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export function WorkbenchProvider({
  api,
  children,
}: {
  api: WorkbenchApi;
  children: ReactNode;
}) {
  const executeCommand = useCallback(
    (commandId: string, args?: unknown) => api.executeCommand(commandId, args),
    [api]
  );

  const value = useMemo(() => ({ api, executeCommand }), [api, executeCommand]);

  return (
    <WorkbenchContext.Provider value={value}>
      {children}
    </WorkbenchContext.Provider>
  );
}

export function useWorkbenchContext(): WorkbenchContextValue {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) {
    throw new Error(
      'useWorkbenchContext must be used within WorkbenchProvider'
    );
  }
  return ctx;
}
