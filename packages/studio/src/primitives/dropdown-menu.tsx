import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight } from 'lucide-react';
import { cloneElement, useCallback, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useThemeScope } from '../context/theme-context';
import { cn } from '../lib/cn';

import styles from './dropdown-menu.module.css';

const SIDE_OFFSET = 4;
/** Negative offset overlaps the submenu onto the parent panel. */
const SUB_OFFSET = -4;

export interface DropdownMenuProps {
  children: ReactNode;
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({
  children,
  modal = true,
  open: openProp,
  onOpenChange,
}: DropdownMenuProps) {
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

  return (
    <DropdownMenuPrimitive.Root
      modal={modal}
      onOpenChange={handleOpenChange}
      open={open}
    >
      {children}
    </DropdownMenuPrimitive.Root>
  );
}

export interface DropdownMenuTriggerProps {
  children: ReactElement<{
    className?: string;
    onClick?: (event: React.MouseEvent) => void;
    'aria-expanded'?: boolean;
    'aria-haspopup'?: 'menu' | boolean;
  }>;
  className?: string;
}

export function DropdownMenuTrigger({
  children,
  className,
}: DropdownMenuTriggerProps) {
  return (
    <DropdownMenuPrimitive.Trigger asChild>
      {cloneElement(children, {
        className: cn(styles.root, className, children.props.className),
      })}
    </DropdownMenuPrimitive.Trigger>
  );
}

export interface DropdownMenuContentProps {
  children: ReactNode;
  align?: 'start' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function DropdownMenuContent({
  children,
  align = 'start',
  side = 'bottom',
  className,
}: DropdownMenuContentProps) {
  const themeScope = useThemeScope();

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        {...themeScope}
        align={align}
        className={cn(styles.content, className)}
        onCloseAutoFocus={(event) => event.preventDefault()}
        side={side}
        sideOffset={SIDE_OFFSET}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export interface DropdownMenuItemProps {
  children: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function DropdownMenuItem({
  children,
  shortcut,
  disabled,
  onSelect,
  className,
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(styles.item, className)}
      disabled={disabled}
      onSelect={() => onSelect?.()}
    >
      <span className={styles.itemLabel}>{children}</span>
      {shortcut ? <span className={styles.shortcut}>{shortcut}</span> : null}
    </DropdownMenuPrimitive.Item>
  );
}

export function DropdownMenuSeparator() {
  return <DropdownMenuPrimitive.Separator className={styles.separator} />;
}

export interface DropdownMenuSubProps {
  children: ReactNode;
}

export function DropdownMenuSub({ children }: DropdownMenuSubProps) {
  return <DropdownMenuPrimitive.Sub>{children}</DropdownMenuPrimitive.Sub>;
}

export interface DropdownMenuSubTriggerProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenuSubTrigger({
  children,
  className,
}: DropdownMenuSubTriggerProps) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(styles.item, styles.subTrigger, className)}
    >
      <span className={styles.itemLabel}>{children}</span>
      <ChevronRight aria-hidden className={styles.subTriggerIcon} size={14} />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export interface DropdownMenuSubContentProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenuSubContent({
  children,
  className,
}: DropdownMenuSubContentProps) {
  const themeScope = useThemeScope();

  return (
    <DropdownMenuPrimitive.SubContent
      {...themeScope}
      className={cn(styles.subContent, className)}
      sideOffset={SUB_OFFSET}
    >
      {children}
    </DropdownMenuPrimitive.SubContent>
  );
}

export interface DropdownMenuRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
}: DropdownMenuRadioGroupProps) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      onValueChange={onValueChange}
      value={value}
    >
      {children}
    </DropdownMenuPrimitive.RadioGroup>
  );
}

export interface DropdownMenuRadioItemProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function DropdownMenuRadioItem({
  children,
  value,
  className,
}: DropdownMenuRadioItemProps) {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(styles.item, className)}
      value={value}
    >
      <span className={styles.itemLabel}>{children}</span>
      <DropdownMenuPrimitive.ItemIndicator className={styles.itemCheck}>
        <Check aria-hidden size={14} />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  );
}

export interface DropdownMenuGroupsProps {
  groups: {
    id: string;
    label: string;
    shortcut?: string;
    disabled?: boolean;
    onSelect?: () => void;
  }[][];
}

export function DropdownMenuGroups({ groups }: DropdownMenuGroupsProps) {
  return (
    <>
      {groups.map((group, groupIndex) => (
        <div key={group.map((item) => item.id).join('-') || groupIndex}>
          {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
          {group.map((item) => (
            <DropdownMenuItem
              disabled={item.disabled}
              key={item.id}
              onSelect={item.onSelect}
              shortcut={item.shortcut}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </div>
      ))}
    </>
  );
}
