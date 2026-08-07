import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { WorkbenchIcon } from '../icons/workbench-icon';
import { cn } from '../lib/cn';
import { Switch } from './switch';

import styles from './panel-section.module.css';

export interface PanelSectionHeaderSwitch {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

export interface PanelSectionProps {
  title: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
  className?: string;
  headerSwitch?: PanelSectionHeaderSwitch;
  /** Optional glyph id rendered ahead of the title. */
  icon?: string;
}

export function PanelSection({
  title,
  defaultOpen = true,
  collapsible = true,
  children,
  className,
  headerSwitch,
  icon,
}: PanelSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const iconNode = icon ? (
    <WorkbenchIcon className={styles.icon} id={icon} size={14} />
  ) : null;

  const switchControl = headerSwitch ? (
    <Switch
      aria-label={headerSwitch.ariaLabel ?? `Toggle ${title}`}
      checked={headerSwitch.checked}
      onChange={(checked) => {
        headerSwitch.onChange(checked);
      }}
    />
  ) : null;

  if (!collapsible) {
    return (
      <section className={cn(styles.root, className)}>
        <div className={styles.headerBar}>
          <div className={styles.headerStatic}>
            {iconNode}
            <span className={styles.title}>{title}</span>
          </div>
          {switchControl}
        </div>
        <div className={styles.body}>{children}</div>
      </section>
    );
  }

  return (
    <section className={cn(styles.root, className)} data-open={open}>
      <div className={styles.headerBar}>
        <button
          aria-expanded={open}
          className={styles.header}
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <ChevronDown aria-hidden className={styles.chevron} size={14} />
          ) : (
            <ChevronRight aria-hidden className={styles.chevron} size={14} />
          )}
          {iconNode}
          <span className={styles.title}>{title}</span>
        </button>
        {switchControl}
      </div>
      {open ? <div className={styles.body}>{children}</div> : null}
    </section>
  );
}
