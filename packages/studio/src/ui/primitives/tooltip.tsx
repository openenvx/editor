import { mergeProps } from '@base-ui/react/merge-props';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cloneElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useThemeScope } from '../../context/theme-context';
import { cn } from '../../lib/cn';

import overlaySurface from './overlay-surface.module.css';
import styles from './tooltip.module.css';

export interface TooltipProps {
  children: ReactElement<{ className?: string }>;
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
    <TooltipPrimitive.Provider delay={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger
          render={(props) =>
            // eslint-disable-next-line react/no-clone-element -- headless trigger composition
            cloneElement(children, mergeProps(props, children.props))
          }
        />
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner align={align} side={side} sideOffset={4}>
            <TooltipPrimitive.Popup
              {...themeScope}
              className={cn(styles.content, overlaySurface.surface, className)}
            >
              <TooltipPrimitive.Viewport>{content}</TooltipPrimitive.Viewport>
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
