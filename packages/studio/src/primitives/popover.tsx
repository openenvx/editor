import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { useThemeScope } from '../context/theme-context';
import { cn } from '../lib/cn';

import overlaySurface from './overlay-surface.module.css';
import styles from './popover.module.css';

const SIDE_OFFSET = 8;
const DEFAULT_COLLISION_PADDING = 8;

interface PopoverConfigValue {
  closeOnTriggerClick: boolean;
  open: boolean;
}

const PopoverConfigContext = createContext<PopoverConfigValue | null>(null);

export interface PopoverProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When false, clicking the trigger again does not close the popover. */
  closeOnTriggerClick?: boolean;
}

export function Popover({
  children,
  open: openProp,
  onOpenChange,
  closeOnTriggerClick = true,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const config = useMemo(
    () => ({ closeOnTriggerClick, open }),
    [closeOnTriggerClick, open]
  );

  return (
    <PopoverConfigContext.Provider value={config}>
      <PopoverPrimitive.Root onOpenChange={handleOpenChange} open={open}>
        {children}
      </PopoverPrimitive.Root>
    </PopoverConfigContext.Provider>
  );
}

export interface PopoverTriggerProps {
  children: ReactElement;
  className?: string;
}

export function PopoverTrigger({ children, className }: PopoverTriggerProps) {
  const config = useContext(PopoverConfigContext);

  return (
    <PopoverPrimitive.Trigger
      asChild
      className={cn(styles.root, className)}
      onClick={(event: React.MouseEvent) => {
        if (config && !config.closeOnTriggerClick && config.open) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </PopoverPrimitive.Trigger>
  );
}

export function PopoverAnchor({ className, style }: PopoverAnchorProps) {
  return (
    <PopoverPrimitive.Anchor
      className={cn(styles.anchor, className)}
      style={style}
    />
  );
}

export interface PopoverAnchorProps {
  className?: string;
  style?: CSSProperties;
}

export interface PopoverPlacement {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  /** Position against the properties panel's left edge instead of the trigger. */
  anchor?: 'trigger' | 'property-edge';
}

export interface PopoverContentProps {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  bodyClassName?: string;
  title?: string;
  variant?: 'default' | 'property';
  placement?: PopoverPlacement;
  onOpenAutoFocus?: (event: Event) => void;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  sticky?: 'partial' | 'always';
}

const PROPERTY_DEFAULT_PLACEMENT: PopoverPlacement = {
  side: 'left',
  align: 'start',
  anchor: 'property-edge',
};

export function PopoverContent({
  children,
  align,
  side,
  className,
  bodyClassName,
  title,
  variant = 'default',
  placement,
  onOpenAutoFocus,
  avoidCollisions = true,
  collisionPadding = DEFAULT_COLLISION_PADDING,
  sticky = 'partial',
}: PopoverContentProps) {
  const themeScope = useThemeScope();

  const isPropertyPopover = variant === 'property';
  const resolvedPlacement = isPropertyPopover
    ? { ...PROPERTY_DEFAULT_PLACEMENT, ...placement }
    : placement;
  const resolvedSide = side ?? resolvedPlacement?.side ?? 'bottom';
  const resolvedAlign = align ?? resolvedPlacement?.align ?? 'end';

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        {...themeScope}
        align={resolvedAlign}
        avoidCollisions={avoidCollisions}
        className={cn(
          styles.panel,
          overlaySurface.surface,
          isPropertyPopover && styles.propertyPanel,
          className
        )}
        collisionPadding={collisionPadding}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onFocusOutside={
          isPropertyPopover ? (event) => event.preventDefault() : undefined
        }
        onOpenAutoFocus={onOpenAutoFocus}
        side={resolvedSide}
        sideOffset={SIDE_OFFSET}
        sticky={sticky}
      >
        {title ? (
          isPropertyPopover ? (
            <>
              <div className={styles.propertyTitle}>{title}</div>
              <div className={styles.propertySeparator} />
            </>
          ) : (
            <div className={styles.header}>{title}</div>
          )
        ) : null}
        <div
          className={cn(
            styles.body,
            isPropertyPopover && styles.propertyBody,
            bodyClassName
          )}
        >
          {children}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
