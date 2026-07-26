import { Slot } from '@radix-ui/react-slot';
import { useRef } from 'react';
import type { ReactNode } from 'react';

import { useInspectorPopoverPanel } from '../context/inspector-popover-context';
import { useInspectorPopoverAnchor } from '../hooks/use-inspector-popover-anchor';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import type { PopoverPlacement, PopoverTriggerProps } from './popover';

export interface InspectorAnchoredPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: PopoverTriggerProps['children'];
  title?: string;
  children: ReactNode;
  placement?: PopoverPlacement;
}

export function InspectorAnchoredPopover({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  placement,
}: InspectorAnchoredPopoverProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const inspectorPanel = useInspectorPopoverPanel();
  const anchorRect = useInspectorPopoverAnchor(
    open,
    inspectorPanel?.panelRef,
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
        <PopoverContent placement={placement} title={title} variant="inspector">
          {children}
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
