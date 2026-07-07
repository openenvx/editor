import { useEffect, useState } from 'react';

import { loadCanvasFonts } from './fonts/load-canvas-fonts';

export function useCanvasFontPreload(families: string[]): number {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void loadCanvasFonts(families).then(() => {
      if (!cancelled) {
        setRevision((value) => value + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [families]);

  return revision;
}
