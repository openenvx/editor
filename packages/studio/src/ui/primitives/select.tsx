import { Select as SelectPrimitive } from '@base-ui/react/select';
import { IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';

import { useThemeScope } from '../../context/theme-context';
import { cn } from '../../lib/cn';

import menuStyles from './dropdown-menu.module.css';
import overlaySurface from './overlay-surface.module.css';
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
      onValueChange={(next) => {
        if (next !== null) {
          onChange(next);
        }
      }}
      open={open}
      value={value}
    >
      <div className={cn(styles.root, className)}>
        <SelectPrimitive.Trigger className={styles.trigger} id={id}>
          <span className={styles.label}>
            <SelectPrimitive.Value />
          </span>
          <SelectPrimitive.Icon>
            <IconChevronDown
              aria-hidden
              className={styles.chevron}
              size={14}
              stroke={1.5}
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner
            align="start"
            collisionPadding={COLLISION_PADDING}
            side="bottom"
            sideOffset={SIDE_OFFSET}
          >
            <SelectPrimitive.Popup
              {...themeScope}
              className={cn(
                menuStyles.content,
                styles.panel,
                overlaySurface.surface
              )}
            >
              <SelectPrimitive.List className={styles.viewport}>
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
              </SelectPrimitive.List>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </div>
    </SelectPrimitive.Root>
  );
}
