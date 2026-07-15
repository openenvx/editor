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

  return (
    <Popover
      closeOnTriggerClick={false}
      onOpenChange={onOpenChange}
      open={open}
    >
      <PopoverTrigger>
        <Slot ref={triggerRef}>{trigger}</Slot>
      </PopoverTrigger>
      {open && anchorRect ? (
        <PopoverAnchor
          style={{
            height: anchorRect.height,
            left: anchorRect.left,
            top: anchorRect.top,
          }}
        />
      ) : null}
      {open && anchorRect ? (
        <PopoverContent placement={placement} title={title} variant="inspector">
          {children}
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
