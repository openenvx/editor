import { EDITOR_DEBUG_LOCAL_STORAGE_KEY } from './editor-diagnostics';

export interface EditorDiagnosticsService {
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
}

export class EditorDiagnosticsServiceImpl implements EditorDiagnosticsService {
  constructor(private enabled: boolean) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(EDITOR_DEBUG_LOCAL_STORAGE_KEY, enabled ? '1' : '0');
    }
  }
}
