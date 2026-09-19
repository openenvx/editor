import { Dialog } from '@base-ui/react/dialog';
import { mergeProps } from '@base-ui/react/merge-props';
import type { ComponentProps, ComponentPropsWithoutRef } from 'react';

import { useThemeScope } from '../context/theme-context';
import { WorkbenchIcon } from '../icons/workbench-icon';
import { cn } from '../lib/cn';
import { Button } from './button';

import styles from './sheet.module.css';

export type SheetSide = 'left' | 'right';

export function Sheet(props: ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

export function SheetTrigger(
  props: ComponentPropsWithoutRef<typeof Dialog.Trigger>
) {
  return <Dialog.Trigger data-slot="sheet-trigger" {...props} />;
}

export function SheetClose(
  props: ComponentPropsWithoutRef<typeof Dialog.Close>
) {
  return <Dialog.Close data-slot="sheet-close" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Dialog.Backdrop>) {
  const themeScope = useThemeScope();
  return (
    <Dialog.Backdrop
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
}: ComponentPropsWithoutRef<typeof Dialog.Popup> & {
  side?: SheetSide;
  showCloseButton?: boolean;
}) {
  const themeScope = useThemeScope();
  return (
    <Dialog.Portal>
      <SheetOverlay />
      <Dialog.Viewport>
        <Dialog.Popup
          {...props}
          {...themeScope}
          className={cn(styles.content, className)}
          data-side={side}
          data-slot="sheet-content"
        >
          {children}
          {showCloseButton ? (
            <Dialog.Close
              render={(closeProps) => (
                <Button
                  {...mergeProps(closeProps, {
                    'aria-label': 'Close',
                    className: styles.close,
                    size: 'icon',
                    type: 'button',
                    variant: 'ghost',
                  })}
                >
                  <WorkbenchIcon id="x" size={14} />
                  <span className={styles.srOnly}>Close</span>
                </Button>
              )}
            />
          ) : null}
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
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
}: ComponentPropsWithoutRef<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      {...props}
      className={cn(styles.title, className)}
      data-slot="sheet-title"
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      {...props}
      className={cn(styles.description, className)}
      data-slot="sheet-description"
    />
  );
}
