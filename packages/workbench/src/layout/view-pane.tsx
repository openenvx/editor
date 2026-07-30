import type { ReactNode } from 'react';

import { InspectorPopoverProvider } from '../context/inspector-popover-context';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { cn } from '../lib/cn';

import styles from './view-pane.module.css';

export interface ViewPaneProps {
  children?: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ViewPane({
  children,
  empty,
  emptyMessage,
  className,
}: ViewPaneProps) {
  const { t } = useWorkbenchTranslation();
  const resolvedEmptyMessage = emptyMessage ?? t('view.empty');
  if (empty) {
    return (
      <div className={cn(styles.empty, className)}>{resolvedEmptyMessage}</div>
    );
  }

  return (
    <InspectorPopoverProvider className={cn(styles.pane, className)}>
      {children}
    </InspectorPopoverProvider>
  );
}
