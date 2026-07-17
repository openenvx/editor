import { createContext, useContext, useMemo, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';

interface InspectorPopoverContextValue {
  panelRef: RefObject<HTMLDivElement | null>;
}

const InspectorPopoverContext =
  createContext<InspectorPopoverContextValue | null>(null);

export function InspectorPopoverProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const value = useMemo(() => ({ panelRef }), []);
  return (
    <InspectorPopoverContext.Provider value={value}>
      <div className={className} ref={panelRef}>
        {children}
      </div>
    </InspectorPopoverContext.Provider>
  );
}

export function useInspectorPopoverPanel() {
  return useContext(InspectorPopoverContext);
}
