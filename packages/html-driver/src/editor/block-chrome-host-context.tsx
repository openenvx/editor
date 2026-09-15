import { createContext, useContext, type ReactNode } from 'react';

import type { BlockChromeHostProps } from '../block-config';

export type { BlockChromeHostProps };

const BlockChromeHostContext = createContext<BlockChromeHostProps | null>(null);

export function BlockChromeHostProvider({
  value,
  children,
}: {
  value: BlockChromeHostProps;
  children: ReactNode;
}) {
  return (
    <BlockChromeHostContext.Provider value={value}>
      {children}
    </BlockChromeHostContext.Provider>
  );
}

export function useBlockChromeHostProps(): BlockChromeHostProps | null {
  return useContext(BlockChromeHostContext);
}
