import { IconChevronDown } from '@tabler/icons-react';
import {
  type FormEvent,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '../lib/cn';
import { WorkbenchIcon } from '../ui/icons/workbench-icon';
import { Button } from '../ui/primitives/button';
import { IconButton } from '../ui/primitives/icon-button';
import { Input } from '../ui/primitives/input';
import type { FloatingToolbarItem } from './floating-toolbar-descriptor';
import {
  HiddenFileInput,
  type HiddenFileInputHandle,
} from './hidden-file-input';

import overlaySurface from '../ui/primitives/overlay-surface.module.css';
import styles from './floating-toolbar.module.css';

export interface FloatingToolbarProps {
  items: FloatingToolbarItem[];
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  onCommand: (commandId: string, args?: Record<string, unknown>) => void;
  onFile?: (commandId: string, file: File) => void;
}

export interface FloatingToolbarSurfaceProps {
  ariaLabel?: string;
  children: ReactNode;
  theme?: string;
  onMouseDown?: (event: ReactMouseEvent) => void;
}

/** Inline floating bar chrome (bubble menus; driver supplies portal position). */
export function FloatingToolbarSurface({
  ariaLabel = 'Formatting',
  children,
  theme,
  onMouseDown,
}: FloatingToolbarSurfaceProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={styles.formatToolbar}
      data-openenvx-rich-text-bubble=""
      data-owb-chrome=""
      data-owb-theme={theme}
      onMouseDown={onMouseDown}
      role="toolbar"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

function colorPickerValue(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
}

export function FloatingToolbar({
  items,
  dragHandleProps,
  onCommand,
  onFile,
}: FloatingToolbarProps) {
  const fileInputRef = useRef<HiddenFileInputHandle>(null);
  const pendingFileCommandRef = useRef<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [popoverDraft, setPopoverDraft] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!(openMenuId || openPopoverId)) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
        setOpenPopoverId(null);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openMenuId, openPopoverId]);

  const [filePickerAccept, setFilePickerAccept] = useState('image/*');

  const submitPopover = (
    event: FormEvent,
    item: Extract<FloatingToolbarItem, { kind: 'popoverField' }>
  ) => {
    event.preventDefault();
    onCommand(item.commandId, { value: popoverDraft });
    setOpenPopoverId(null);
  };

  return (
    <>
      {items.map((item) => {
        if (item.kind === 'separator') {
          return <span aria-hidden className={styles.divider} key={item.id} />;
        }
        if (item.kind === 'label') {
          return (
            <span className={styles.label} key={item.id}>
              {item.text}
            </span>
          );
        }
        if (item.kind === 'toggle') {
          return (
            <IconButton
              active={item.active}
              aria-label={item.ariaLabel}
              aria-pressed={item.active}
              key={item.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onCommand(item.commandId, item.args)}
              type="button"
            >
              <WorkbenchIcon id={item.icon} size={14} />
            </IconButton>
          );
        }
        if (item.kind === 'color') {
          return (
            <span className={styles.colorControl} key={item.id}>
              <IconButton
                aria-label={item.ariaLabel ?? 'Color'}
                tabIndex={-1}
                type="button"
              >
                <WorkbenchIcon id="highlight" size={14} />
              </IconButton>
              <input
                aria-label={item.ariaLabel ?? 'Color'}
                className={styles.colorInput}
                onChange={(event) => {
                  onCommand(item.commandId, { value: event.target.value });
                }}
                type="color"
                value={colorPickerValue(item.value)}
              />
            </span>
          );
        }
        if (item.kind === 'menu') {
          const selected = item.options.find((o) => o.value === item.value);
          const triggerLabel =
            selected?.label ??
            item.triggerLabel ??
            item.options[0]?.label ??
            '…';
          return (
            <div
              className={`${styles.formatGroup} ${styles.popoverAnchor}`}
              key={item.id}
              ref={openMenuId === item.id ? popoverRef : undefined}
            >
              <Button
                aria-expanded={openMenuId === item.id}
                aria-haspopup="menu"
                aria-label={item.ariaLabel}
                className={styles.blockTypeButton}
                onClick={() => {
                  setOpenPopoverId(null);
                  setOpenMenuId((open) => (open === item.id ? null : item.id));
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                <span>{triggerLabel}</span>
                <IconChevronDown size={14} stroke={1.5} />
              </Button>
              {openMenuId === item.id ? (
                <div
                  className={cn(styles.blockTypeMenu, overlaySurface.popup)}
                  role="menu"
                >
                  {item.options.map((option) => {
                    const isSelected = option.value === item.value;
                    return (
                      <Button
                        aria-checked={isSelected}
                        className={`${styles.blockTypeMenuItem} ${isSelected ? styles.blockTypeMenuItemActive : ''}`}
                        key={option.value}
                        onClick={() => {
                          onCommand(item.commandId, { value: option.value });
                          setOpenMenuId(null);
                        }}
                        role="menuitemradio"
                        type="button"
                        variant="ghost"
                      >
                        <span className={styles.blockTypeMenuIcon}>
                          <WorkbenchIcon id={option.icon} size={14} />
                        </span>
                        <span>{option.label}</span>
                        {isSelected ? (
                          <span
                            aria-hidden
                            className={styles.blockTypeMenuCheck}
                          >
                            ✓
                          </span>
                        ) : null}
                      </Button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        }
        if (item.kind === 'popoverField') {
          return (
            <div
              className={`${styles.formatGroup} ${styles.popoverAnchor}`}
              key={item.id}
              ref={openPopoverId === item.id ? popoverRef : undefined}
            >
              <IconButton
                active={item.active}
                aria-label={item.ariaLabel}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setOpenMenuId(null);
                  setPopoverDraft(item.value || 'https://');
                  setOpenPopoverId((open) =>
                    open === item.id ? null : item.id
                  );
                }}
                type="button"
              >
                <WorkbenchIcon id={item.icon} size={14} />
              </IconButton>
              {openPopoverId === item.id ? (
                <form
                  className={cn(styles.linkPopover, overlaySurface.popup)}
                  onSubmit={(event) => submitPopover(event, item)}
                >
                  <Input
                    aria-label={item.ariaLabel}
                    autoFocus
                    className={styles.linkField}
                    onChange={(event) => setPopoverDraft(event.target.value)}
                    placeholder={item.placeholder}
                    size="sm"
                    value={popoverDraft}
                  />
                  <Button size="sm" type="submit" variant="default">
                    {item.submitLabel ?? 'Apply'}
                  </Button>
                  {item.clear ? (
                    <Button
                      onClick={() => {
                        onCommand(item.clear!.commandId, { value: '' });
                        setOpenPopoverId(null);
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {item.clear.label}
                    </Button>
                  ) : null}
                </form>
              ) : null}
            </div>
          );
        }
        if (item.kind === 'file') {
          return (
            <IconButton
              aria-label={item.ariaLabel}
              key={item.id}
              onClick={() => {
                pendingFileCommandRef.current = item.commandId;
                setFilePickerAccept(item.accept);
                fileInputRef.current?.pick();
              }}
              type="button"
            >
              <WorkbenchIcon id={item.icon} size={14} />
            </IconButton>
          );
        }
        const drag =
          item.dragHandle && dragHandleProps
            ? { ...dragHandleProps }
            : undefined;
        return (
          <IconButton
            aria-label={item.ariaLabel}
            className={item.dragHandle ? styles.dragHandle : undefined}
            key={item.id}
            onClick={
              item.dragHandle || !item.commandId
                ? undefined
                : () => onCommand(item.commandId!, item.args)
            }
            type="button"
            {...drag}
          >
            <WorkbenchIcon id={item.icon} size={14} />
          </IconButton>
        );
      })}
      {onFile ? (
        <HiddenFileInput
          accept={filePickerAccept}
          onPick={(file) => {
            const commandId = pendingFileCommandRef.current;
            pendingFileCommandRef.current = null;
            onFile(commandId ?? '', file);
          }}
          ref={fileInputRef}
        />
      ) : null}
    </>
  );
}
