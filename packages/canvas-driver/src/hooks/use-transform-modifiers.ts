import { useCallback, useEffect, useRef } from 'react';

import type { CanvasTransformModifiers } from '../registry/canvas-registry-types';

export function useTransformModifiers() {
  const shiftKeyRef = useRef(false);
  const altKeyRef = useRef(false);
  const metaKeyRef = useRef(false);

  useEffect(() => {
    const resetModifiers = () => {
      shiftKeyRef.current = false;
      altKeyRef.current = false;
      metaKeyRef.current = false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        shiftKeyRef.current = true;
      }
      if (event.key === 'Alt') {
        altKeyRef.current = true;
      }
      if (event.key === 'Meta' || event.key === 'Control') {
        metaKeyRef.current = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        shiftKeyRef.current = false;
      }
      if (event.key === 'Alt') {
        altKeyRef.current = false;
      }
      if (event.key === 'Meta' || event.key === 'Control') {
        metaKeyRef.current = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', resetModifiers);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', resetModifiers);
    };
  }, []);

  const getTransformModifiers = useCallback(
    (): CanvasTransformModifiers => ({
      alt: altKeyRef.current,
      meta: metaKeyRef.current,
      shift: shiftKeyRef.current,
    }),
    []
  );

  return { getTransformModifiers };
}
