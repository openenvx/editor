import * as SheetPrimitive from '@radix-ui/react-dialog';
import type { ComponentProps, ComponentPropsWithoutRef } from 'react';

import { useThemeScope } from '../context/theme-context';
import { WorkbenchIcon } from '../icons/workbench-icon';
import { cn } from '../lib/cn';
import { Button } from './button';

import styles from './sheet.module.css';

export type SheetSide = 'left' | 'right';

/** @xmazu / BeyondCanvas Sheet root (`@radix-ui/react-dialog`). */
export function Sheet(props: SheetPrimitive.DialogProps) {
  return <SheetPrimitive.Root {...props} />;
}

export function SheetTrigger(
  props: ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>
) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

export function SheetClose(
  props: ComponentPropsWithoutRef<typeof SheetPrimitive.Close>
) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>) {
  const themeScope = useThemeScope();
  return (
    <SheetPrimitive.Overlay
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
}: ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
  side?: SheetSide;
  showCloseButton?: boolean;
}) {
  const themeScope = useThemeScope();
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        {...props}
        {...themeScope}
        className={cn(styles.content, className)}
        data-side={side}
        data-slot="sheet-content"
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close asChild data-slot="sheet-close">
            <Button
              aria-label="Close"
              className={styles.close}
              size="icon"
              type="button"
              variant="ghost"
            >
              <WorkbenchIcon id="x" size={14} />
              <span className={styles.srOnly}>Close</span>
            </Button>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
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
      className={cn(styles.footer, className)}
      data-slot="sheet-footer"
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SheetPrimitive.Title>) {
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
}: ComponentPropsWithoutRef<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      {...props}
      className={cn(styles.description, className)}
      data-slot="sheet-description"
    />
  );
}
