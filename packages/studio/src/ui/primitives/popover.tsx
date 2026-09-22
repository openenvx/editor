import { mergeProps } from '@base-ui/react/merge-props';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  cloneElement,
} from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { useThemeScope } from '../../context/theme-context';
import { cn } from '../../lib/cn';

import overlaySurface from './overlay-surface.module.css';
import styles from './popover.module.css';

const SIDE_OFFSET = 8;
const DEFAULT_COLLISION_PADDING = 8;

interface PopoverConfigValue {
  closeOnTriggerClick: boolean;
  open: boolean;
}

interface PopoverAnchorValue {
  anchor: HTMLElement | null;
  setAnchor: (element: HTMLElement | null) => void;
}

const PopoverConfigContext = createContext<PopoverConfigValue | null>(null);
const PopoverAnchorContext = createContext<PopoverAnchorValue | null>(null);

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
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
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

  const anchorValue = useMemo(() => ({ anchor, setAnchor }), [anchor]);

  return (
    <PopoverAnchorContext.Provider value={anchorValue}>
      <PopoverConfigContext.Provider value={config}>
        <PopoverPrimitive.Root onOpenChange={handleOpenChange} open={open}>
          {children}
        </PopoverPrimitive.Root>
      </PopoverConfigContext.Provider>
    </PopoverAnchorContext.Provider>
  );
}

export interface PopoverTriggerProps {
  children: ReactElement;
  className?: string;
}

export function PopoverTrigger({ children, className }: PopoverTriggerProps) {
  const config = useContext(PopoverConfigContext);
  const child = children as ReactElement<{
    className?: string;
    onClick?: (event: React.MouseEvent) => void;
  }>;

  return (
    <PopoverPrimitive.Trigger
      className={cn(styles.root, className)}
      onClick={(event: React.MouseEvent) => {
        if (config && !config.closeOnTriggerClick && config.open) {
          event.preventDefault();
        }
        child.props.onClick?.(event);
      }}
      render={(props) =>
        // eslint-disable-next-line react/no-clone-element -- headless trigger composition
        cloneElement(child, mergeProps(props, child.props))
      }
    />
  );
}

export interface PopoverAnchorProps {
  className?: string;
  style?: CSSProperties;
}

export function PopoverAnchor({ className, style }: PopoverAnchorProps) {
  const anchorCtx = useContext(PopoverAnchorContext);

  return (
    <div
      className={cn(styles.anchor, className)}
      ref={(node) => anchorCtx?.setAnchor(node)}
      style={style}
    />
  );
}

export interface PopoverPlacement {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
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
  onOpenAutoFocus: _onOpenAutoFocus,
  avoidCollisions = true,
  collisionPadding = DEFAULT_COLLISION_PADDING,
}: PopoverContentProps) {
  const themeScope = useThemeScope();
  const anchorCtx = useContext(PopoverAnchorContext);

  const isPropertyPopover = variant === 'property';
  const resolvedPlacement = isPropertyPopover
    ? { ...PROPERTY_DEFAULT_PLACEMENT, ...placement }
    : placement;
  const resolvedSide = side ?? resolvedPlacement?.side ?? 'bottom';
  const resolvedAlign = align ?? resolvedPlacement?.align ?? 'end';
  const useCustomAnchor =
    resolvedPlacement?.anchor === 'property-edge' && anchorCtx?.anchor;

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={resolvedAlign}
        anchor={useCustomAnchor ? (anchorCtx?.anchor ?? undefined) : undefined}
        collisionPadding={avoidCollisions ? collisionPadding : undefined}
        side={resolvedSide}
        sideOffset={SIDE_OFFSET}
      >
        <PopoverPrimitive.Popup
          {...themeScope}
          className={cn(
            styles.panel,
            overlaySurface.surface,
            isPropertyPopover && styles.propertyPanel,
            className
          )}
        >
          <PopoverPrimitive.Viewport>
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
          </PopoverPrimitive.Viewport>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}
