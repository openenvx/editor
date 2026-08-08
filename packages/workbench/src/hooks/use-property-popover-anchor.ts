import { useCallback, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

export interface PropertyPopoverAnchorRect {
  top: number;
  left: number;
  height: number;
  side: 'left' | 'right';
}

function propertyPopoverOpensLeft(panelRect: DOMRect): boolean {
  const viewportMid =
    (typeof document !== 'undefined'
      ? document.documentElement.clientWidth
      : 0) / 2;
  const panelCenter = panelRect.left + panelRect.width / 2;
  return panelCenter > viewportMid;
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
  const opensLeft = propertyPopoverOpensLeft(panelRect);
  const clampedTop = Math.min(
    Math.max(triggerRect.top, panelRect.top),
    Math.max(panelRect.bottom - triggerRect.height, panelRect.top)
  );
  return {
    height: triggerRect.height,
    left: opensLeft ? panelRect.left : panelRect.right,
    side: opensLeft ? 'left' : 'right',
    top: clampedTop,
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
