import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

import { useThemeScope } from '../context/theme-context';
import { cn } from '../lib/cn';

import styles from './tooltip.module.css';

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  className,
}: TooltipProps) {
  const themeScope = useThemeScope();
  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            {...themeScope}
            align={align}
            className={cn(styles.content, className)}
            side={side}
            sideOffset={4}
          >
            {content}
            <TooltipPrimitive.Arrow className={styles.arrow} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
