import { Slot } from '@radix-ui/react-slot';
import { useRef } from 'react';
import type { ReactNode } from 'react';

import { usePropertyPopoverPanel } from '../context/property-popover-context';
import { usePropertyPopoverAnchor } from '../hooks/use-property-popover-anchor';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import type { PopoverPlacement, PopoverTriggerProps } from './popover';

export interface PropertyAnchoredPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: PopoverTriggerProps['children'];
  title?: string;
  children: ReactNode;
  placement?: PopoverPlacement;
}

export function PropertyAnchoredPopover({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  placement,
}: PropertyAnchoredPopoverProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const propertyPanel = usePropertyPopoverPanel();
  const anchorRect = usePropertyPopoverAnchor(
    open,
    propertyPanel?.panelRef,
    triggerRef
  );
  const lastAnchorRef = useRef(anchorRect);
  if (anchorRect) {
    lastAnchorRef.current = anchorRect;
  }
  // Keep last rect so Radix Presence can play exit while Root.open is false.
  const displayAnchor = anchorRect ?? lastAnchorRef.current;

  return (
    <Popover
      closeOnTriggerClick={false}
      onOpenChange={onOpenChange}
      open={open}
    >
      <PopoverTrigger>
        <Slot ref={triggerRef}>{trigger}</Slot>
      </PopoverTrigger>
      {displayAnchor ? (
        <PopoverAnchor
          style={{
            height: displayAnchor.height,
            left: displayAnchor.left,
            top: displayAnchor.top,
          }}
        />
      ) : null}
      {displayAnchor ? (
        <PopoverContent placement={placement} title={title} variant="property">
          {children}
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
