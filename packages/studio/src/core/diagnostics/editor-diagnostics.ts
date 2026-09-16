import type { EditorDiagnosticsService } from './editor-diagnostics-service';

export const EDITOR_DEBUG_LOCAL_STORAGE_KEY = 'openenvx:debug';

export type EditorDiagnosticLevel = 'info' | 'warn' | 'error';

let diagnosticsGate: EditorDiagnosticsService | null = null;

/** Bound once at workbench bootstrap. */
export function bindEditorDiagnosticsService(
  service: EditorDiagnosticsService
): void {
  diagnosticsGate = service;
  if (service.isEnabled()) {
    logEditorDiagnosticsEnabledBanner();
  }
}

export function logEditorDiagnosticsEnabledBanner(): void {
  editorDiagnosticLog(
    'diagnostics',
    'info',
    'Editor diagnostics enabled - [OpenEnvx] property.when, property.field, and other scopes will log here.',
    {
      localStorageKey: EDITOR_DEBUG_LOCAL_STORAGE_KEY,
      hint: 'Set localStorage openenvx:debug to 0 to disable, or api.setEditorDebug(false).',
    },
    'diagnostics-enabled-banner'
  );
}

export function isEditorDiagnosticsEnabled(): boolean {
  return diagnosticsGate?.isEnabled() ?? false;
}

/**
 * Resolve initial enabled state (browser only). Call once when creating the controller.
 * `controllerDefault` - e.g. `import.meta.env.DEV` from the app shell.
 */
export function resolveEditorDiagnosticsFromBrowser(
  controllerDefault = false,
  storage?: Pick<Storage, 'getItem'>
): boolean {
  const store =
    storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  if (store) {
    const stored = store.getItem(EDITOR_DEBUG_LOCAL_STORAGE_KEY);
    if (stored === '0') {
      return false;
    }
    if (stored === '1') {
      return true;
    }
  }
  return controllerDefault;
}

const loggedOnceKeys = new Set<string>();

export function resetEditorDiagnosticLogsForTests(): void {
  loggedOnceKeys.clear();
}

export function editorDiagnosticLog(
  scope: string,
  level: EditorDiagnosticLevel,
  message: string,
  data?: Record<string, unknown>,
  dedupeKey?: string
): void {
  if (!isEditorDiagnosticsEnabled()) {
    return;
  }
  const onceKey = dedupeKey ?? `${scope}|${level}|${message}`;
  if (loggedOnceKeys.has(onceKey)) {
    return;
  }
  loggedOnceKeys.add(onceKey);

  const title = `[OpenEnvx] ${scope}: ${message}`;
  const logFn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.info;
  if (data === undefined) {
    logFn(title);
    return;
  }
  console.groupCollapsed(title);
  logFn('message', message);
  console.log(data);
  console.groupEnd();
}
