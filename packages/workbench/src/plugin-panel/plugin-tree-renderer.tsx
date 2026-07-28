import type {
  PluginChild,
  PluginNode,
} from '@xmazu/openenvxee-plugin-protocol';
import type { ReactNode } from 'react';

import { WorkbenchIcon } from '../icons/workbench-icon';
import { cn } from '../lib/cn';
import { Button } from '../primitives/button';
import { IconButton } from '../primitives/icon-button';
import { Input } from '../primitives/input';
import { PanelSection } from '../primitives/panel-section';
import { Select } from '../primitives/select';

import styles from './plugin-panel.module.css';

export interface PluginTreeRendererProps {
  root: PluginNode;
  onEvent: (handlerId: string, args?: unknown) => void;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function fire(
  onEvent: PluginTreeRendererProps['onEvent'],
  handlerId: unknown,
  args?: unknown
): void {
  if (typeof handlerId === 'string' && handlerId.length > 0) {
    onEvent(handlerId, args);
  }
}

function renderChildren(
  children: PluginChild[],
  onEvent: PluginTreeRendererProps['onEvent']
): ReactNode[] {
  return children.map((child, index) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return <span key={`t-${index}`}>{child}</span>;
    }
    if (!child || typeof child === 'boolean') {
      return null;
    }
    return (
      <PluginNodeView
        key={child.key ?? `n-${index}`}
        node={child}
        onEvent={onEvent}
      />
    );
  });
}

function PluginNodeView({
  node,
  onEvent,
}: {
  node: PluginNode;
  onEvent: PluginTreeRendererProps['onEvent'];
}): ReactNode {
  const { type, props, children } = node;

  switch (type) {
    case 'Panel': {
      return (
        <PanelSection
          collapsible={false}
          title={asString(props.title, 'Plugin')}
        >
          {renderChildren(children, onEvent)}
        </PanelSection>
      );
    }
    case 'Stack': {
      const direction = asString(props.direction, 'column');
      const gap = asString(props.gap, 'md');
      const align = asString(props.align, 'stretch');
      return (
        <div
          className={cn(
            styles.stack,
            direction === 'row' ? styles.stackRow : styles.stackColumn,
            gap === 'none' && styles.gapNone,
            gap === 'sm' && styles.gapSm,
            gap === 'md' && styles.gapMd,
            gap === 'lg' && styles.gapLg,
            align === 'start' && styles.alignStart,
            align === 'center' && styles.alignCenter,
            align === 'end' && styles.alignEnd,
            align === 'stretch' && styles.alignStretch
          )}
        >
          {renderChildren(children, onEvent)}
        </div>
      );
    }
    case 'Text': {
      const tone = asString(props.tone, 'default');
      const size = asString(props.size, 'md');
      return (
        <p
          className={cn(
            styles.text,
            tone === 'muted' && styles.textMuted,
            tone === 'destructive' && styles.textDestructive,
            size === 'sm' && styles.textSm,
            size === 'md' && styles.textMd,
            size === 'lg' && styles.textLg
          )}
        >
          {renderChildren(children, onEvent)}
        </p>
      );
    }
    case 'Button': {
      return (
        <Button
          disabled={asBoolean(props.disabled)}
          onClick={() => fire(onEvent, props.onClick)}
          size={asString(props.size, 'default') === 'sm' ? 'sm' : 'default'}
          variant={
            asString(props.variant, 'default') === 'ghost' ? 'ghost' : 'default'
          }
        >
          {renderChildren(children, onEvent)}
        </Button>
      );
    }
    case 'IconButton': {
      return (
        <IconButton
          aria-label={asString(props.label, asString(props.icon, 'action'))}
          disabled={asBoolean(props.disabled)}
          onClick={() => fire(onEvent, props.onClick)}
          size={asString(props.size, 'default') === 'sm' ? 'sm' : 'default'}
        >
          <WorkbenchIcon id={asString(props.icon, 'sparkles')} size={14} />
        </IconButton>
      );
    }
    case 'Input': {
      return (
        <Input
          disabled={asBoolean(props.disabled)}
          onChange={(event) =>
            fire(onEvent, props.onChange, event.currentTarget.value)
          }
          placeholder={asString(props.placeholder)}
          value={asString(props.value)}
        />
      );
    }
    case 'Select': {
      const optionsRaw = props.options;
      const options = Array.isArray(optionsRaw)
        ? optionsRaw.flatMap((item) => {
            if (
              typeof item === 'object' &&
              item !== null &&
              !Array.isArray(item) &&
              typeof item.value === 'string' &&
              typeof item.label === 'string'
            ) {
              return [{ value: item.value, label: item.label }];
            }
            return [];
          })
        : [];
      return (
        <Select
          onChange={(value) => fire(onEvent, props.onChange, value)}
          options={options}
          value={asString(props.value, options[0]?.value ?? '')}
        />
      );
    }
    case 'Switch': {
      return (
        <label className={styles.switch}>
          <input
            checked={asBoolean(props.checked)}
            className={styles.switchInput}
            disabled={asBoolean(props.disabled)}
            onChange={(event) =>
              fire(onEvent, props.onChange, event.currentTarget.checked)
            }
            type="checkbox"
          />
          {asString(props.label) || renderChildren(children, onEvent)}
        </label>
      );
    }
    case 'ImageGrid': {
      const itemsRaw = props.items;
      const items = Array.isArray(itemsRaw)
        ? itemsRaw.flatMap((item, index) => {
            if (
              typeof item === 'object' &&
              item !== null &&
              !Array.isArray(item) &&
              typeof item.url === 'string'
            ) {
              return [
                {
                  url: item.url,
                  id: typeof item.id === 'string' ? item.id : String(index),
                  label:
                    typeof item.label === 'string' ? item.label : undefined,
                },
              ];
            }
            return [];
          })
        : [];
      return (
        <div className={styles.imageGrid}>
          {items.map((item) => (
            <button
              className={styles.imageGridItem}
              key={item.id}
              onClick={() => fire(onEvent, props.onSelect, item)}
              type="button"
            >
              <img alt="" className={styles.imageGridImg} src={item.url} />
              {item.label ? (
                <span className={styles.imageGridLabel}>{item.label}</span>
              ) : null}
            </button>
          ))}
        </div>
      );
    }
    case 'Divider': {
      return <hr className={styles.divider} />;
    }
    default: {
      return null;
    }
  }
}

export function PluginTreeRenderer({
  root,
  onEvent,
}: PluginTreeRendererProps): ReactNode {
  return <PluginNodeView node={root} onEvent={onEvent} />;
}
