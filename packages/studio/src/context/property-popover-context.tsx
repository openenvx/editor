import { createContext, useContext, useMemo, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';

interface PropertyPopoverContextValue {
  panelRef: RefObject<HTMLDivElement | null>;
}

const PropertyPopoverContext =
  createContext<PropertyPopoverContextValue | null>(null);

export function PropertyPopoverProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const value = useMemo(() => ({ panelRef }), []);
  return (
    <PropertyPopoverContext.Provider value={value}>
      <div className={className} ref={panelRef}>
        {children}
      </div>
    </PropertyPopoverContext.Provider>
  );
}

export function usePropertyPopoverPanel() {
  return useContext(PropertyPopoverContext);
}
