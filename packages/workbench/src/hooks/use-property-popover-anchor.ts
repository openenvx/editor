import { useCallback, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

export interface PropertyPopoverAnchorRect {
  top: number;
  left: number;
  height: number;
}

export function measurePropertyPopoverAnchor(
  panelRef: RefObject<HTMLElement | null> | undefined,
  triggerRef: RefObject<HTMLElement | null>
): PropertyPopoverAnchorRect | null {
  const panel = panelRef?.current;
  const trigger = triggerRef.current;
  if (!panel || !trigger) {
    return null;
  }
  const panelRect = panel.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  return {
    left: panelRect.left,
    top: triggerRect.top,
    height: triggerRect.height,
  };
}

export function usePropertyPopoverAnchor(
  open: boolean,
  panelRef: RefObject<HTMLElement | null> | undefined,
  triggerRef: RefObject<HTMLElement | null>
) {
  const [anchorRect, setAnchorRect] =
    useState<PropertyPopoverAnchorRect | null>(null);

  const updateAnchor = useCallback(() => {
    const next = measurePropertyPopoverAnchor(panelRef, triggerRef);
    if (next) {
      setAnchorRect(next);
    }
  }, [panelRef, triggerRef]);

  useLayoutEffect(() => {
    if (!open) {
      setAnchorRect(null);
      return;
    }
    updateAnchor();
    window.addEventListener('scroll', updateAnchor, true);
    window.addEventListener('resize', updateAnchor);
    return () => {
      window.removeEventListener('scroll', updateAnchor, true);
      window.removeEventListener('resize', updateAnchor);
    };
  }, [open, updateAnchor]);

  if (!open) {
    return null;
  }

  return measurePropertyPopoverAnchor(panelRef, triggerRef) ?? anchorRect;
}
