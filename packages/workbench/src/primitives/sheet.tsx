import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import type { ComponentProps, ReactNode } from 'react';

import { useThemeScope } from '../context/theme-context';
import { WorkbenchIcon } from '../icons/workbench-icon';
import { cn } from '../lib/cn';
import { Button } from './button';

import styles from './sheet.module.css';

export type SheetSide = 'left' | 'right';

/** @xmazu / BeyondCanvas Sheet root (`@base-ui/react/dialog`). */
export function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

export function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

export function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(props: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  const themeScope = useThemeScope();
  return (
    <SheetPrimitive.Backdrop
      {...props}
      {...themeScope}
      className={cn(styles.overlay, className)}
      data-slot="sheet-overlay"
    />
  );
}

export function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: SheetSide;
  showCloseButton?: boolean;
}) {
  const themeScope = useThemeScope();
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        {...props}
        {...themeScope}
        className={cn(styles.content, className)}
        data-side={side}
        data-slot="sheet-content"
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                aria-label="Close"
                className={styles.close}
                size="icon"
                type="button"
                variant="ghost"
              />
            }
          >
            <WorkbenchIcon id="x" size={14} />
            <span className={styles.srOnly}>Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(styles.header, className)}
      data-slot="sheet-header"
    />
  );
}

export function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(styles.header, className)}
      data-slot="sheet-footer"
      style={{ marginTop: 'auto', ...props.style }}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      {...props}
      className={cn(styles.title, className)}
      data-slot="sheet-title"
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      {...props}
      className={cn(styles.description, className)}
      data-slot="sheet-description"
    />
  );
}

/** Convenience wrapper matching @xmazu inspector-sheet open/onClose contract. */
export function InspectorSheet({
  open,
  onClose,
  title,
  description,
  side = 'right',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: SheetSide;
  children: ReactNode;
}) {
  return (
    <Sheet
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      open={open}
    >
      <SheetContent showCloseButton side={side}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
