import { Menu } from '@base-ui/react/menu';
import { mergeProps } from '@base-ui/react/merge-props';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { cloneElement, useCallback, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useThemeScope } from '../context/theme-context';
import { cn } from '../lib/cn';
import { formatShortcut } from '../lib/format-shortcut';

import styles from './dropdown-menu.module.css';
import overlaySurface from './overlay-surface.module.css';

const SIDE_OFFSET = 4;
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
    <Menu.Root modal={modal} onOpenChange={handleOpenChange} open={open}>
      {children}
    </Menu.Root>
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
    <Menu.Trigger
      render={(props) =>
        // Base UI trigger must merge props onto the child (asChild). Child props first so
        // trigger refs/handlers from `props` win — mergeProps(props, child) drops trigger ref.
        // eslint-disable-next-line react/no-clone-element -- headless trigger composition
        cloneElement(
          children,
          mergeProps(children.props, props, {
            className: cn(
              styles.root,
              className,
              props.className,
              children.props.className
            ),
          })
        )
      }
    />
  );
}

export interface DropdownMenuContentProps {
  children: ReactNode;
  align?: 'start' | 'end' | 'center';
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
    <Menu.Portal>
      <Menu.Positioner align={align} side={side} sideOffset={SIDE_OFFSET}>
        <Menu.Popup
          {...themeScope}
          className={cn(styles.content, overlaySurface.surface, className)}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
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
    <Menu.Item
      className={cn(styles.item, className)}
      disabled={disabled}
      onClick={() => onSelect?.()}
    >
      <span className={styles.itemLabel}>{children}</span>
      {shortcut ? (
        <span className={styles.shortcut}>{formatShortcut(shortcut)}</span>
      ) : null}
    </Menu.Item>
  );
}

export function DropdownMenuSeparator() {
  return <div aria-hidden className={styles.separator} role="separator" />;
}

export interface DropdownMenuSubProps {
  children: ReactNode;
}

export function DropdownMenuSub({ children }: DropdownMenuSubProps) {
  return <Menu.SubmenuRoot>{children}</Menu.SubmenuRoot>;
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
    <Menu.SubmenuTrigger
      className={cn(styles.item, styles.subTrigger, className)}
    >
      <span className={styles.itemLabel}>{children}</span>
      <IconChevronRight
        aria-hidden
        className={styles.subTriggerIcon}
        size={14}
        stroke={1.5}
      />
    </Menu.SubmenuTrigger>
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
    <Menu.Portal>
      <Menu.Positioner align="start" side="inline-end" sideOffset={SUB_OFFSET}>
        <Menu.Popup
          {...themeScope}
          className={cn(styles.subContent, overlaySurface.surface, className)}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
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
    <Menu.RadioGroup onValueChange={onValueChange} value={value}>
      {children}
    </Menu.RadioGroup>
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
    <Menu.RadioItem className={cn(styles.item, className)} value={value}>
      <span className={styles.itemIndicator}>
        <Menu.RadioItemIndicator>
          <IconCheck aria-hidden size={11} stroke={2.5} />
        </Menu.RadioItemIndicator>
      </span>
      <span className={styles.itemLabel}>{children}</span>
    </Menu.RadioItem>
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
              onSelect={() => item.onSelect?.()}
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
