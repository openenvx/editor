import {
  mapPluginTreeToPropertyPane,
  createPluginPropertyHostContext,
  createManifestContributions,
  decodePluginHandlerCommand,
  type PropertyPaneDescriptor,
  type WorkbenchContributionDisposable,
} from '@openenvx/headless';
import {
  PLUGIN_HOST_SOURCE,
  PLUGIN_PARENT_SOURCE,
  type PluginChild,
  type PluginNode,
  type PluginPanelContext,
  type PluginPanelDeclaration,
  type PluginPanelSelection,
  validatePluginTree,
} from '@xmazu/openenvxee-plugin-protocol';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { PropertyContentRenderer } from '../renderers/property-content-renderer';
import { canRunPluginPanelCommand } from './plugin-panel-command-gate';
import type { PluginPanelTransport } from './plugin-panel-transport';

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

function isPluginNode(child: PluginChild): child is PluginNode {
  return typeof child === 'object' && child !== null && 'type' in child;
}

/** Seed host values from field `value` props bound to `plugin.<panelId>.*`. */
function extractPluginValues(
  node: PluginNode,
  panelId: string,
  out: Record<string, unknown>
): void {
  const bind = node.props.bind;
  if (
    typeof bind === 'string' &&
    bind.startsWith(`plugin.${panelId}.`) &&
    'value' in node.props
  ) {
    out[bind.slice(`plugin.${panelId}.`.length)] = node.props.value;
  }
  for (const child of node.children) {
    if (isPluginNode(child)) {
      extractPluginValues(child, panelId, out);
    }
  }
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
  const fieldRenderers = useWorkbenchContextSelector(
    (state) => state.fieldRenderers
  );
  const [root, setRoot] = useState<PluginNode | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const lastTreeAtRef = useRef(0);
  const pendingTreeRef = useRef<PluginNode | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manifestDisposableRef = useRef<WorkbenchContributionDisposable | null>(
    null
  );

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

  const applyRoot = useCallback(
    (next: PluginNode) => {
      if (next.type !== 'Pane') {
        setRoot(null);
        setPanelError(`Plugin panel root must be Pane, got ${next.type}`);
        return;
      }
      const nextValues: Record<string, unknown> = {};
      extractPluginValues(next, declaration.id, nextValues);
      setValues(nextValues);
      setPanelError(null);
      setRoot(next);
    },
    [declaration.id]
  );

  const scheduleTree = useCallback(
    (candidate: unknown) => {
      const validated = validatePluginTree(candidate, {
        externalPanelId: declaration.id,
      });
      if (!validated.ok) {
        setRoot(null);
        setPanelError(validated.reason);
        return;
      }
      const now = Date.now();
      if (now - lastTreeAtRef.current >= TREE_THROTTLE_MS) {
        lastTreeAtRef.current = now;
        applyRoot(validated.root);
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
          applyRoot(pending);
        }
      }, TREE_THROTTLE_MS);
    },
    [applyRoot, declaration.id]
  );

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
      if (message.type === 'panel:manifest') {
        manifestDisposableRef.current?.dispose();
        manifestDisposableRef.current = null;
        if (!declaration.allowManifest) {
          setPanelError(
            'panel:manifest requires allowManifest on the declaration'
          );
          return;
        }
        if (permission !== 'edit') {
          setPanelError('Session is read-only');
          return;
        }
        const result = createManifestContributions(message.payload.manifest, {
          allowedCommands: declaration.allowedCommands,
        });
        if (!result.ok) {
          setPanelError(result.reason);
          return;
        }
        if (result.contributions.length > 0) {
          manifestDisposableRef.current = api.registerWorkbenchContributions(
            ...result.contributions
          );
        }
        return;
      }
      if (message.type === 'panel:command') {
        const { commandId, args } = message.payload;
        if (!canRunPluginPanelCommand(declaration, permission, commandId)) {
          setPanelError(
            permission !== 'edit'
              ? 'Session is read-only'
              : `Command not allowed: ${commandId}`
          );
          return;
        }
        void api
          .executeCommand(commandId, args)
          .catch((commandError: unknown) => {
            setPanelError(
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

  const mapped = useMemo((): {
    pane: PropertyPaneDescriptor | null;
    mapError: string | null;
  } => {
    if (!root) {
      return { pane: null, mapError: null };
    }
    try {
      return {
        pane: mapPluginTreeToPropertyPane(root, { panelId: declaration.id }),
        mapError: null,
      };
    } catch (error: unknown) {
      return {
        pane: null,
        mapError:
          error instanceof Error ? error.message : 'Failed to map plugin tree',
      };
    }
  }, [declaration.id, root]);

  useEffect(() => {
    if (root || panelError || mapped.mapError) {
      return;
    }
    const timer = setTimeout(() => {
      setPanelError(`Panel "${declaration.title}" did not send a tree in time`);
    }, FIRST_TREE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [declaration.title, panelError, mapped.mapError, root]);

  useEffect(
    () => () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      manifestDisposableRef.current?.dispose();
      manifestDisposableRef.current = null;
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

  const pane = mapped.pane;

  const hostContext = useMemo(
    () =>
      createPluginPropertyHostContext({
        panelId: declaration.id,
        values,
        onWrite: (path, value) => {
          setValues({ ...valuesRef.current });
          onEvent(path, value);
        },
      }),
    [declaration.id, onEvent, values]
  );

  const handleCommand = useCallback(
    (commandId: string) => {
      const handlerId = decodePluginHandlerCommand(commandId);
      if (handlerId !== null) {
        onEvent(handlerId);
        return;
      }
      if (!canRunPluginPanelCommand(declaration, permission, commandId)) {
        setPanelError(
          permission !== 'edit'
            ? 'Session is read-only'
            : `Command not allowed: ${commandId}`
        );
        return;
      }
      void api.executeCommand(commandId).catch((commandError: unknown) => {
        setPanelError(
          commandError instanceof Error
            ? commandError.message
            : `Command failed: ${commandId}`
        );
      });
    },
    [api, declaration, onEvent, permission]
  );

  const displayError = panelError ?? mapped.mapError;
  if (displayError) {
    return (
      <div className={styles.root}>
        <p className={styles.error}>
          {declaration.title}: {displayError}
        </p>
      </div>
    );
  }

  if (!root || !pane) {
    return (
      <div className={styles.root}>
        <p className={styles.waiting}>Waiting for {declaration.title}…</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <PropertyContentRenderer
        fieldRenderers={fieldRenderers ?? []}
        hostContext={hostContext}
        layerData={values}
        layerId={declaration.id}
        nodes={pane.nodes}
        onCommand={handleCommand}
      />
    </div>
  );
}
