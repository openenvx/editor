import type { ViewContainerLocation } from '@openenvx/headless';
import { MoreHorizontal } from 'lucide-react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';

import styles from './view-container-header.module.css';

export interface ViewContainerMoveMenuProps {
  containerId: string;
  location: ViewContainerLocation;
}

export function ViewContainerMoveMenu({
  containerId,
  location,
}: ViewContainerMoveMenuProps) {
  const { api } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();
  const targetLocation: ViewContainerLocation =
    location === 'primary' ? 'secondary' : 'primary';
  const moveLabel =
    targetLocation === 'secondary'
      ? t('view.moveToSecondary')
      : t('view.moveToPrimary');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={styles.menuTrigger}>
        <button
          aria-label={t('view.containerMenu')}
          className={styles.menuButton}
          type="button"
        >
          <MoreHorizontal aria-hidden size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom">
        <DropdownMenuItem
          onSelect={() => {
            api.moveContainer(containerId, targetLocation);
          }}
        >
          {moveLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface ViewContainerHeaderProps {
  containerId: string;
  title: string;
  location: ViewContainerLocation;
}

export function ViewContainerHeader({
  containerId,
  title,
  location,
}: ViewContainerHeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.title}>{title}</span>
      <ViewContainerMoveMenu containerId={containerId} location={location} />
    </div>
  );
}
