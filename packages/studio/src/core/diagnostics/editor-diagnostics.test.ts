import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  bindEditorDiagnosticsService,
  editorDiagnosticLog,
  isEditorDiagnosticsEnabled,
  resetEditorDiagnosticLogsForTests,
  resolveEditorDiagnosticsFromBrowser,
} from './editor-diagnostics';
import { EditorDiagnosticsServiceImpl } from './editor-diagnostics-service';

describe('editor diagnostics', () => {
  afterEach(() => {
    resetEditorDiagnosticLogsForTests();
    bindEditorDiagnosticsService(new EditorDiagnosticsServiceImpl(false));
  });

  it('resolveEditorDiagnosticsFromBrowser prefers localStorage', () => {
    const storage = {
      getItem: vi.fn((key: string) =>
        key === 'openenvx:debug' ? '0' : null
      ),
      setItem: vi.fn(),
    };
    expect(
      resolveEditorDiagnosticsFromBrowser(true, storage as Storage)
    ).toBe(false);
    expect(
      resolveEditorDiagnosticsFromBrowser(false, {
        getItem: () => '1',
        setItem: vi.fn(),
      } as Storage)
    ).toBe(true);
    expect(resolveEditorDiagnosticsFromBrowser(true, storage as Storage)).toBe(
      false
    );
    expect(
      resolveEditorDiagnosticsFromBrowser(true, {
        getItem: () => null,
        setItem: vi.fn(),
      } as Storage)
    ).toBe(true);
  });

  it('editorDiagnosticLog is a no-op when disabled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    editorDiagnosticLog('test', 'warn', 'hello');
    expect(warn).not.toHaveBeenCalled();
  });

  it('editorDiagnosticLog dedupes when enabled', () => {
    bindEditorDiagnosticsService(new EditorDiagnosticsServiceImpl(true));
    expect(isEditorDiagnosticsEnabled()).toBe(true);
    const group = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const groupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    editorDiagnosticLog('test', 'warn', 'dup', { a: 1 }, 'key-1');
    editorDiagnosticLog('test', 'warn', 'dup', { a: 2 }, 'key-1');
    expect(group).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledTimes(1);
    expect(groupEnd).toHaveBeenCalledTimes(1);
  });

  it('editorDiagnosticLog uses console.error for error level', () => {
    bindEditorDiagnosticsService(new EditorDiagnosticsServiceImpl(true));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    editorDiagnosticLog('test', 'error', 'bad field', undefined, 'err-1');
    expect(error).toHaveBeenCalledWith('[OpenEnvx] test: bad field');
  });
});
