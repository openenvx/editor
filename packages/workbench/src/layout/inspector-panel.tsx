import type { ReactNode } from 'react';

import { InspectorPopoverProvider } from '../context/inspector-popover-context';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { cn } from '../lib/cn';

import styles from './inspector-panel.module.css';

export interface InspectorPanelProps {
  children?: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function InspectorPanel({
  children,
  empty,
  emptyMessage,
  className,
}: InspectorPanelProps) {
  const { t } = useWorkbenchTranslation();
  const resolvedEmptyMessage = emptyMessage ?? t('inspector.empty');
  if (empty) {
    return (
      <div className={cn(styles.empty, className)}>{resolvedEmptyMessage}</div>
    );
  }

  return (
    <InspectorPopoverProvider className={cn(styles.inspector, className)}>
      {children}
    </InspectorPopoverProvider>
  );
}
