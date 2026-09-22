import { afterEach, describe, expect, it, vi } from 'vitest';

import { bindEditorDiagnosticsService } from './diagnostics/editor-diagnostics';
import { EditorDiagnosticsServiceImpl } from './diagnostics/editor-diagnostics-service';
import { PropertyPath } from './properties/property-path';
import {
  evaluateContextKeyWhenExpression,
  evaluatePropertyLayoutWhen,
} from './evaluate-when-expression';

describe('evaluatePropertyLayoutWhen', () => {
  afterEach(() => {
    bindEditorDiagnosticsService(new EditorDiagnosticsServiceImpl(false));
  });

  it('reads $ paths via readPath and ignores bare path-shaped tokens', () => {
    const reads: string[] = [];
    expect(
      evaluatePropertyLayoutWhen(
        PropertyPath.when(PropertyPath.layerData('enabled')),
        {
          contextKeys: {},
          readPath: (path) => {
            reads.push(path);
            return path.endsWith('enabled');
          },
        }
      )
    ).toBe(true);
    expect(reads).toEqual(['selection.layer.data.enabled']);

    expect(
      evaluatePropertyLayoutWhen('selection.layer.data.enabled', {
        contextKeys: {},
        readPath: () => true,
      })
    ).toBe(false);
  });

  it('mixes context keys and $ paths', () => {
    expect(
      evaluatePropertyLayoutWhen(
        `page.layoutAbsolute && ${PropertyPath.when(PropertyPath.layerData('mode'))} == 'advanced'`,
        {
          contextKeys: { 'page.layoutAbsolute': true },
          readPath: (path) =>
            path === 'selection.layer.data.mode' ? 'advanced' : '',
        }
      )
    ).toBe(true);
  });

  it('reacts to sibling property values', () => {
    let enabled = false;
    const clause = PropertyPath.when(PropertyPath.layerData('shadowEnabled'));
    expect(
      evaluatePropertyLayoutWhen(clause, {
        contextKeys: {},
        readPath: () => enabled,
      })
    ).toBe(false);
    enabled = true;
    expect(
      evaluatePropertyLayoutWhen(clause, {
        contextKeys: {},
        readPath: () => enabled,
      })
    ).toBe(true);
  });

  it('logs bare path-shaped tokens when diagnostics enabled', () => {
    bindEditorDiagnosticsService(new EditorDiagnosticsServiceImpl(true));
    const group = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    evaluatePropertyLayoutWhen('selection.layer.data.enabled', {
      contextKeys: {},
      readPath: () => true,
      meta: { nodeLabel: 'Blur' },
    });
    expect(warn).toHaveBeenCalled();
    expect(info).toHaveBeenCalled();
    group.mockRestore();
    warn.mockRestore();
    info.mockRestore();
  });
});

describe('evaluateContextKeyWhenExpression', () => {
  afterEach(() => {
    bindEditorDiagnosticsService(new EditorDiagnosticsServiceImpl(false));
  });

  const keys = new Map<string, boolean | string | number>([
    ['scene.layerSelected', true],
    ['page.mode', 'edit'],
  ]);

  it('evaluates bare context keys', () => {
    expect(
      evaluateContextKeyWhenExpression('scene.layerSelected', keys)
    ).toBe(true);
    expect(
      evaluateContextKeyWhenExpression('!scene.layerSelected', keys)
    ).toBe(false);
  });

  it('ignores $ property-path tokens (pane/menu context-key only)', () => {
    expect(
      evaluateContextKeyWhenExpression('$selection.layer.data.enabled', keys)
    ).toBe(false);
  });

  it('treats empty or whitespace clause as visible', () => {
    expect(evaluateContextKeyWhenExpression(undefined, keys)).toBe(true);
    expect(evaluateContextKeyWhenExpression('  ', keys)).toBe(true);
  });

  it('supports quoted == comparisons', () => {
    expect(evaluateContextKeyWhenExpression("page.mode == 'edit'", keys)).toBe(
      true
    );
    expect(evaluateContextKeyWhenExpression("page.mode == 'view'", keys)).toBe(
      false
    );
  });

  it('splits on || before && (no parentheses)', () => {
    expect(
      evaluateContextKeyWhenExpression('missingKey || scene.layerSelected', keys)
    ).toBe(true);
    expect(
      evaluateContextKeyWhenExpression('scene.layerSelected && missingKey', keys)
    ).toBe(false);
    expect(
      evaluateContextKeyWhenExpression('true || false && false', keys)
    ).toBe(true);
    expect(
      evaluateContextKeyWhenExpression('false || true && false', keys)
    ).toBe(false);
  });
});
