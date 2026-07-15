import { createContext, useContext, useRef } from 'react';
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
  return (
    <InspectorPopoverContext.Provider value={{ panelRef }}>
      <div className={className} ref={panelRef}>
        {children}
      </div>
    </InspectorPopoverContext.Provider>
  );
}

export function useInspectorPopoverPanel() {
  return useContext(InspectorPopoverContext);
}
