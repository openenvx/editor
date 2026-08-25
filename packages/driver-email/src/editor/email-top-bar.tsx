import { ContextKeyServiceId } from '@openenvx/core';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/core/react';
import {
  HtmlPreviewChromeServiceId,
  type HtmlDevicePreset,
} from '@openenvx/html';
import {
  Check,
  ChevronLeft,
  Code2,
  Eye,
  Monitor,
  MoreHorizontal,
  Pencil,
  Redo2,
  Smartphone,
  Undo2,
} from 'lucide-react';
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  WORKBENCH_OPEN_COMMAND_ID,
  WORKBENCH_SAVE_AS_COMMAND_ID,
  WORKBENCH_SAVE_COMMAND_ID,
  WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID,
} from '../contributions/email-chrome-commands';
import {
  EmailEditorModeServiceId,
  type EmailEditorMode,
} from './email-editor-mode-service';

import styles from './email-top-bar.module.css';

export interface EmailTopBarProps {
  onBack?: () => void;
}

function useEmailEditorMode(): EmailEditorMode {
  const { api } = useWorkbenchContext();
  const service = api.getService(EmailEditorModeServiceId);
  const keys = api.getService(ContextKeyServiceId);
  const serviceRef = useRef(service);
  const keysRef = useRef(keys);
  serviceRef.current = service;
  keysRef.current = keys;

  const subscribe = useCallback((onStoreChange: () => void) => {
    const instance = serviceRef.current;
    if (!instance) {
      return () => {};
    }
    instance.bindContextKeys(keysRef.current ?? null);
    const sub = instance.onDidChange(() => onStoreChange());
    return () => {
      sub.dispose();
    };
  }, []);

  const getSnapshot = useCallback(
    (): EmailEditorMode => serviceRef.current?.getMode() ?? 'edit',
    []
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => 'edit');
}

function useHtmlDevicePreset(): HtmlDevicePreset {
  const { api } = useWorkbenchContext();
  const chrome = api.getService(HtmlPreviewChromeServiceId);
  const chromeRef = useRef(chrome);
  chromeRef.current = chrome;

  const subscribe = useCallback((onStoreChange: () => void) => {
    const instance = chromeRef.current;
    if (!instance) {
      return () => {};
    }
    const sub = instance.onDidChange(() => onStoreChange());
    return () => {
      sub.dispose();
    };
  }, []);

  const getSnapshot = useCallback(
    (): HtmlDevicePreset => chromeRef.current?.getState().preset ?? 'desktop',
    []
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => 'desktop');
}

interface ModeOption {
  mode: EmailEditorMode;
  label: string;
  icon: ReactNode;
  commandId: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    commandId: 'email.enterEditMode',
    icon: <Pencil aria-hidden size={14} />,
    label: 'Editor',
    mode: 'edit',
  },
  {
    commandId: 'email.enterHtmlMode',
    icon: <Code2 aria-hidden size={14} />,
    label: 'HTML',
    mode: 'html',
  },
  {
    commandId: 'email.enterPreviewMode',
    icon: <Eye aria-hidden size={14} />,
    label: 'Preview',
    mode: 'preview',
  },
];

export const EmailTopBar = memo(({ onBack }: EmailTopBarProps) => {
  const { executeCommand } = useWorkbenchContext();
  const editorTitle = useWorkbenchContextSelector(
    (state) => state.editor?.title
  );
  const isDirty = useWorkbenchContextSelector(
    (state) => state.editor?.isDirty ?? false
  );
  const commandStates = useWorkbenchContextSelector(
    (state) => state.commandStates
  );
  const mode = useEmailEditorMode();
  const devicePreset = useHtmlDevicePreset();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title = editorTitle?.trim() || 'Untitled';
  const canUndo = commandStates?.['scene.undo']?.canExecute ?? false;
  const canRedo = commandStates?.['scene.redo']?.canExecute ?? false;
  const canSave =
    commandStates?.[WORKBENCH_SAVE_COMMAND_ID]?.canExecute ?? true;
  const canSaveAs =
    commandStates?.[WORKBENCH_SAVE_AS_COMMAND_ID]?.canExecute ?? false;
  const canOpen =
    commandStates?.[WORKBENCH_OPEN_COMMAND_ID]?.canExecute ?? false;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [menuOpen]);

  const setDevicePreset = (preset: HtmlDevicePreset) => {
    void executeCommand('html.setDevicePreset', { preset });
  };

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        {onBack ? (
          <button
            aria-label="Back"
            className={styles.backButton}
            type="button"
            onClick={onBack}
          >
            <ChevronLeft aria-hidden size={14} />
          </button>
        ) : null}
        <button className={styles.titleButton} type="button">
          {title}
        </button>
      </div>

      <div className={styles.center}>
        {MODE_OPTIONS.map((option) => (
          <button
            className={[
              styles.modeButton,
              mode === option.mode ? styles.modeButtonActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={option.mode}
            type="button"
            onClick={() => void executeCommand(option.commandId)}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.right}>
        {!isDirty ? (
          <span className={styles.saved}>
            <Check aria-hidden className={styles.savedIcon} size={12} />
            Saved
          </span>
        ) : null}

        <button
          aria-label="Undo"
          className={styles.iconButton}
          disabled={!canUndo}
          type="button"
          onClick={() => void executeCommand('scene.undo')}
        >
          <Undo2 aria-hidden size={14} />
        </button>
        <button
          aria-label="Redo"
          className={styles.iconButton}
          disabled={!canRedo}
          type="button"
          onClick={() => void executeCommand('scene.redo')}
        >
          <Redo2 aria-hidden size={14} />
        </button>

        <span className={styles.divider} />

        <div className={styles.deviceGroup}>
          <button
            aria-label="Desktop preview"
            aria-pressed={devicePreset === 'desktop'}
            className={[
              styles.deviceButton,
              devicePreset === 'desktop' ? styles.deviceButtonActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            type="button"
            onClick={() => setDevicePreset('desktop')}
          >
            <Monitor aria-hidden size={14} />
          </button>
          <button
            aria-label="Mobile preview"
            aria-pressed={devicePreset === 'mobile'}
            className={[
              styles.deviceButton,
              devicePreset === 'mobile' ? styles.deviceButtonActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            type="button"
            onClick={() => setDevicePreset('mobile')}
          >
            <Smartphone aria-hidden size={14} />
          </button>
        </div>

        <span className={styles.divider} />

        <button
          className={styles.saveButton}
          disabled={!canSave}
          type="button"
          onClick={() => void executeCommand(WORKBENCH_SAVE_COMMAND_ID)}
        >
          Save
        </button>

        <div className={styles.menuWrap} ref={menuRef}>
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="More actions"
            className={styles.iconButton}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal aria-hidden size={14} />
          </button>
          {menuOpen ? (
            <div className={styles.menuContent} role="menu">
              {canOpen ? (
                <button
                  className={styles.menuItem}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void executeCommand(WORKBENCH_OPEN_COMMAND_ID);
                  }}
                >
                  Open…
                </button>
              ) : null}
              {canSaveAs ? (
                <button
                  className={styles.menuItem}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void executeCommand(WORKBENCH_SAVE_AS_COMMAND_ID);
                  }}
                >
                  Save as…
                </button>
              ) : null}
              <button
                className={styles.menuItem}
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void executeCommand(
                    WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID
                  );
                }}
              >
                Command palette
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

EmailTopBar.displayName = 'EmailTopBar';
