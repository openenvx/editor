import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { useThemeScope } from '../context/theme-context';
import { cn } from '../lib/cn';

import menuStyles from './dropdown-menu.module.css';
import styles from './select.module.css';

const SIDE_OFFSET = 4;
const COLLISION_PADDING = 8;

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

export function Select({
  id,
  value,
  onChange,
  options,
  className,
}: SelectProps) {
  const themeScope = useThemeScope();
  const [open, setOpen] = useState(false);

  return (
    <SelectPrimitive.Root
      onOpenChange={setOpen}
      onValueChange={onChange}
      open={open}
      value={value}
    >
      <div className={cn(styles.root, className)}>
        <SelectPrimitive.Trigger className={styles.trigger} id={id}>
          <span className={styles.label}>
            <SelectPrimitive.Value />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown aria-hidden className={styles.chevron} size={14} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            {...themeScope}
            align="start"
            avoidCollisions
            className={cn(menuStyles.content, styles.panel)}
            collisionPadding={COLLISION_PADDING}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onPointerDownOutside={() => setOpen(false)}
            position="popper"
            side="bottom"
            sideOffset={SIDE_OFFSET}
            sticky="partial"
          >
            <SelectPrimitive.Viewport className={styles.viewport}>
              {options.map((option) => (
                <SelectPrimitive.Item
                  className={cn(
                    menuStyles.item,
                    option.value === value ? styles.optionSelected : undefined
                  )}
                  key={option.value}
                  value={option.value}
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </div>
    </SelectPrimitive.Root>
  );
}
