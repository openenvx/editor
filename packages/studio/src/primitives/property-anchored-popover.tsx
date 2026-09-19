import { useRef, cloneElement } from 'react';
import type { ReactElement, ReactNode, Ref } from 'react';

import { usePropertyPopoverPanel } from '../context/property-popover-context';
import { usePropertyPopoverAnchor } from '../hooks/use-property-popover-anchor';
import { mergeRefs } from '../lib/merge-refs';
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
  const displayAnchor = anchorRect ?? lastAnchorRef.current;

  const triggerElement = trigger as ReactElement<{
    ref?: Ref<HTMLElement>;
  }>;

  return (
    <Popover
      closeOnTriggerClick={false}
      onOpenChange={onOpenChange}
      open={open}
    >
      <PopoverTrigger>
        {
          // eslint-disable-next-line react/no-clone-element -- merge trigger ref for anchor math
          cloneElement(triggerElement, {
            ref: mergeRefs(
              triggerRef,
              triggerElement.props.ref as Ref<HTMLElement> | undefined
            ),
          })
        }
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
        <PopoverContent
          avoidCollisions={false}
          placement={{
            ...placement,
            align: 'start',
            side: displayAnchor.side,
          }}
          title={title}
          variant="property"
        >
          {children}
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
