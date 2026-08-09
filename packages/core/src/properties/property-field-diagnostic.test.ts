import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bindEditorDiagnosticsService,
  resetEditorDiagnosticLogsForTests,
} from '../diagnostics/editor-diagnostics';
import { EditorDiagnosticsServiceImpl } from '../diagnostics/editor-diagnostics-service';
import { diagnosePropertyFieldDescriptor } from './property-field-diagnostic';
import { safeParsePropertyFieldDescriptor } from './property-field-schema';

describe('property field schema', () => {
  it('rejects numeric on segmented', () => {
    const result = safeParsePropertyFieldDescriptor({
      key: 'borderRadius',
      kind: 'segmented',
      label: 'Radius',
      options: [{ value: 'a', label: 'A' }],
      numeric: { min: 0, max: 48 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.code === 'unrecognized_keys')).toBe(
        true
      );
    }
  });

  it('requires options for select', () => {
    const result = safeParsePropertyFieldDescriptor({
      key: 'mode',
      kind: 'select',
      label: 'Mode',
    });
    expect(result.success).toBe(false);
  });

  it('accepts cornerRadius with numeric', () => {
    const result = safeParsePropertyFieldDescriptor({
      key: 'radius',
      kind: 'cornerRadius',
      label: 'Radius',
      numeric: { min: 0, max: 48, unit: 'px' },
    });
    expect(result.success).toBe(true);
  });

  it('passthrough extra keys for custom kinds', () => {
    const result = safeParsePropertyFieldDescriptor({
      key: 'custom',
      kind: 'svgNodes',
      label: 'Nodes',
      numeric: { min: 0 },
    });
    expect(result.success).toBe(true);
  });
});

describe.sequential('property field diagnostic', () => {
  beforeEach(() => {
    bindEditorDiagnosticsService(new EditorDiagnosticsServiceImpl(false));
    resetEditorDiagnosticLogsForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetEditorDiagnosticLogsForTests();
    bindEditorDiagnosticsService(new EditorDiagnosticsServiceImpl(false));
  });

  it('logs warn for numeric on segmented when enabled', () => {
    bindEditorDiagnosticsService(new EditorDiagnosticsServiceImpl(true));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const group = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const groupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    diagnosePropertyFieldDescriptor({
      key: 'borderRadius',
      kind: 'segmented',
      label: 'Radius',
      options: [{ value: 'sm', label: 'Small' }],
      numeric: { max: 48, min: 0, step: 1, unit: 'px' },
    });

    expect(warn).toHaveBeenCalled();
    expect(group).toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
    expect(groupEnd).toHaveBeenCalled();
  });

  it('is a no-op when diagnostics disabled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    diagnosePropertyFieldDescriptor({
      key: 'x',
      kind: 'segmented',
      label: 'X',
      options: [{ value: 'a', label: 'A' }],
      numeric: { min: 0 },
    });
    expect(warn).not.toHaveBeenCalled();
  });
});
