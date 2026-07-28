import {
  PLUGIN_HOST_SOURCE,
  PLUGIN_PARENT_SOURCE,
  type PluginNode,
  type PluginPanelContext,
  type PluginPanelDeclaration,
  type PluginPanelSelection,
  validatePluginTree,
} from '@openenvx/plugin-protocol';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { canRunPluginPanelCommand } from './plugin-panel-command-gate';
import type { PluginPanelTransport } from './plugin-panel-transport';
import { PluginTreeRenderer } from './plugin-tree-renderer';

import styles from './plugin-panel.module.css';

const TREE_THROTTLE_MS = 50;
const FIRST_TREE_TIMEOUT_MS = 8000;

export interface PluginPanelProps {
  declaration: PluginPanelDeclaration;
  transport: PluginPanelTransport;
  templateId?: string | null;
  permission?: 'read' | 'edit';
  theme?: string;
}

function selectionFromState(
  selection: PluginPanelSelection | null | undefined
): PluginPanelSelection {
  return {
    activePageId: selection?.activePageId ?? '',
    selectedLayerIds: selection?.selectedLayerIds ?? [],
    primaryLayerId: selection?.primaryLayerId ?? null,
  };
}

export function PluginPanel({
  declaration,
  transport,
  templateId = null,
  permission = 'read',
  theme = 'dark',
}: PluginPanelProps): ReactNode {
  const { api } = useWorkbenchContext();
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const [root, setRoot] = useState<PluginNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastTreeAtRef = useRef(0);
  const pendingTreeRef = useRef<PluginNode | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildContext = useCallback((): PluginPanelContext => {
    const payload: PluginPanelContext = {
      panelId: declaration.id,
      templateId,
      permission,
      theme,
      selection: selectionFromState(
        selection as PluginPanelSelection | null | undefined
      ),
    };
    if (declaration.contextScope === 'scene' && scene) {
      payload.scene = scene;
    }
    return payload;
  }, [
    declaration.contextScope,
    declaration.id,
    permission,
    scene,
    selection,
    templateId,
    theme,
  ]);

  const scheduleTree = useCallback((candidate: unknown) => {
    const validated = validatePluginTree(candidate);
    if (!validated.ok) {
      setRoot(null);
      setError(validated.reason);
      return;
    }
    const now = Date.now();
    if (now - lastTreeAtRef.current >= TREE_THROTTLE_MS) {
      lastTreeAtRef.current = now;
      setError(null);
      setRoot(validated.root);
      return;
    }
    pendingTreeRef.current = validated.root;
    if (throttleTimerRef.current) {
      return;
    }
    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = null;
      lastTreeAtRef.current = Date.now();
      const pending = pendingTreeRef.current;
      pendingTreeRef.current = null;
      if (pending) {
        setError(null);
        setRoot(pending);
      }
    }, TREE_THROTTLE_MS);
  }, []);

  useEffect(() => {
    const unsubscribe = transport.subscribe((message) => {
      if (message.source !== PLUGIN_PARENT_SOURCE || message.v !== 1) {
        return;
      }
      if (message.payload.panelId !== declaration.id) {
        return;
      }
      if (message.type === 'panel:tree') {
        scheduleTree(message.payload.root);
        return;
      }
      if (message.type === 'panel:command') {
        const { commandId, args } = message.payload;
        if (!canRunPluginPanelCommand(declaration, permission, commandId)) {
          setError(
            permission !== 'edit'
              ? 'Session is read-only'
              : `Command not allowed: ${commandId}`
          );
          return;
        }
        void api
          .executeCommand(commandId, args)
          .catch((commandError: unknown) => {
            setError(
              commandError instanceof Error
                ? commandError.message
                : `Command failed: ${commandId}`
            );
          });
      }
    });
    return unsubscribe;
  }, [api, declaration, permission, scheduleTree, transport]);

  useEffect(() => {
    transport.send({
      source: PLUGIN_HOST_SOURCE,
      v: 1,
      type: 'panel:context',
      payload: buildContext(),
    });
  }, [buildContext, transport]);

  useEffect(() => {
    if (root || error) {
      return;
    }
    const timer = setTimeout(() => {
      setError(`Panel "${declaration.title}" did not send a tree in time`);
    }, FIRST_TREE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [declaration.title, error, root]);

  useEffect(
    () => () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    },
    []
  );

  const onEvent = useCallback(
    (handlerId: string, args?: unknown) => {
      transport.send({
        source: PLUGIN_HOST_SOURCE,
        v: 1,
        type: 'panel:event',
        payload: {
          panelId: declaration.id,
          handlerId,
          ...(args === undefined ? {} : { args }),
        },
      });
    },
    [declaration.id, transport]
  );

  if (error) {
    return (
      <div className={styles.root}>
        <p className={styles.error}>
          {declaration.title}: {error}
        </p>
      </div>
    );
  }

  if (!root) {
    return (
      <div className={styles.root}>
        <p className={styles.waiting}>Waiting for {declaration.title}…</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <PluginTreeRenderer onEvent={onEvent} root={root} />
    </div>
  );
}
