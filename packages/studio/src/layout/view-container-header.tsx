import type {
  SidebarHeaderDescriptor,
  ViewContainerLocation,
} from '@openenvx/studio/core';
import { IconChevronDown, IconDots } from '@tabler/icons-react';
import { useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { WorkbenchIcon } from '../ui/icons/workbench-icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/primitives/dropdown-menu';
import { IconButton } from '../ui/primitives/icon-button';
import { DropdownMenuRenderer } from '../ui/renderers/dropdown-menu-renderer';

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
      <DropdownMenuTrigger>
        <IconButton
          aria-label={t('view.containerMenu')}
          className={styles.actionButton}
        >
          <IconDots aria-hidden size={14} stroke={1.5} />
        </IconButton>
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
  header?: SidebarHeaderDescriptor;
}

export function ViewContainerHeader({
  containerId,
  title,
  location,
  header,
}: ViewContainerHeaderProps) {
  const { api } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();
  const editorTitle = useWorkbenchContextSelector(
    (state) => state.editor?.title
  );
  const commandStates = useWorkbenchContextSelector(
    (state) => state.commandStates
  );

  const displayTitle = useMemo(() => {
    if (header?.titleBinding === 'editorTitle') {
      return editorTitle?.trim() || title;
    }
    if (header?.titleKey) {
      return t(header.titleKey);
    }
    if (header?.title) {
      return header.title;
    }
    return title;
  }, [editorTitle, header, t, title]);

  const menuItems = header?.menuItems;
  const actions = header?.actions ?? [];
  const showMoveMenu = header ? header.showMoveMenu : true;

  return (
    <div className={styles.header}>
      <div className={styles.titleArea}>
        {menuItems && menuItems.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button
                aria-label={displayTitle}
                className={styles.titleButton}
                type="button"
              >
                <span className={styles.title}>{displayTitle}</span>
                <IconChevronDown
                  aria-hidden
                  className={styles.titleChevron}
                  size={12}
                  stroke={1.5}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom">
              <DropdownMenuRenderer items={menuItems} />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className={styles.title}>{displayTitle}</span>
        )}
      </div>
      <div className={styles.actions}>
        {actions.map((action) => {
          const ariaLabel = action.labelKey
            ? t(action.labelKey)
            : (action.label ?? action.id);
          const disabled = commandStates?.[action.commandId]
            ? !commandStates[action.commandId]!.canExecute
            : false;
          return (
            <IconButton
              aria-label={ariaLabel}
              className={styles.actionButton}
              disabled={disabled}
              key={action.id}
              onClick={() => {
                void api.executeCommand(action.commandId);
              }}
              title={ariaLabel}
            >
              <WorkbenchIcon id={action.icon} size={16} />
            </IconButton>
          );
        })}
        {showMoveMenu ? (
          <ViewContainerMoveMenu
            containerId={containerId}
            location={location}
          />
        ) : null}
      </div>
    </div>
  );
}
