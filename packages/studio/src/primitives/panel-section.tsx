import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

import styles from './panel-section.module.css';

export interface PanelSectionProps {
  title: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
  className?: string;
}

export function PanelSection({
  title,
  defaultOpen = true,
  collapsible = true,
  children,
  className,
}: PanelSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <section className={cn(styles.root, className)}>
        <div className={styles.headerStatic}>{title}</div>
        <div className={styles.body}>{children}</div>
      </section>
    );
  }

  return (
    <section className={cn(styles.root, className)}>
      <button
        aria-expanded={open}
        className={styles.header}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? (
          <ChevronDown aria-hidden className={styles.chevron} size={14} />
        ) : (
          <ChevronRight aria-hidden className={styles.chevron} size={14} />
        )}
        {title}
      </button>
      {open ? <div className={styles.body}>{children}</div> : null}
    </section>
  );
}
