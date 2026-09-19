import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

import { cn } from '../lib/cn';

import styles from './tabs.module.css';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    className={cn(styles.list, className)}
    ref={ref}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Tab>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Tab
    className={cn(styles.trigger, className)}
    ref={ref}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Panel>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Panel> & {
    forceMount?: boolean;
  }
>(({ className, forceMount, ...props }, ref) => (
  <TabsPrimitive.Panel
    className={cn(styles.content, className)}
    keepMounted={forceMount}
    ref={ref}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
