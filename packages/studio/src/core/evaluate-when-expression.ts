import { isEditorDiagnosticsEnabled } from './diagnostics/editor-diagnostics';
import {
  diagnosePropertyWhenToken,
  logPropertyWhenEval,
  type PropertyWhenEvalMeta,
  type PropertyWhenTokenResolution,
} from './properties/property-when-diagnostic';

export type WhenContextKeyMap = Map<string, boolean | string | number>;

export type WhenResolveToken = (
  token: string
) => boolean | string | number | undefined;

/**
 * Evaluate a when-expression (`&&`, `||`, `!`, `==`, truthiness).
 * Token resolution is delegated to `resolveToken` (context keys vs `$` paths).
 */
export function evaluateWhenExpression(
  expression: string | undefined,
  resolveToken: WhenResolveToken
): boolean {
  if (!expression?.trim()) {
    return true;
  }
  return evaluateExpression(expression.trim(), resolveToken);
}

function evaluateExpression(
  expr: string,
  resolveToken: WhenResolveToken
): boolean {
  if (expr.includes('||')) {
    return expr
      .split('||')
      .some((part) => evaluateExpression(part.trim(), resolveToken));
  }
  if (expr.includes('&&')) {
    return expr
      .split('&&')
      .every((part) => evaluateExpression(part.trim(), resolveToken));
  }
  if (expr.startsWith('!')) {
    return !evaluateExpression(expr.slice(1).trim(), resolveToken);
  }
  const eqMatch = expr.match(/^(.+?)\s*==\s*(.+)$/);
  if (eqMatch) {
    const left = resolveWhenValue(eqMatch[1]!.trim(), resolveToken);
    const right = resolveWhenValue(eqMatch[2]!.trim(), resolveToken);
    return left === right;
  }
  const value = resolveWhenValue(expr, resolveToken);
  return Boolean(value);
}

function resolveWhenValue(
  token: string,
  resolveToken: WhenResolveToken
): boolean | string | number {
  if (
    (token.startsWith("'") && token.endsWith("'")) ||
    (token.startsWith('"') && token.endsWith('"'))
  ) {
    return token.slice(1, -1);
  }
  if (token === 'true') {
    return true;
  }
  if (token === 'false') {
    return false;
  }
  const resolved = resolveToken(token);
  if (resolved === undefined) {
    return false;
  }
  return resolved;
}

/** Context-key-only resolver (menus, pane filter, toolbars). */
export function resolveContextKeyToken(
  token: string,
  keys: WhenContextKeyMap
): boolean | string | number | undefined {
  if (token.startsWith('$')) {
    return undefined;
  }
  const keyValue = keys.get(token);
  if (keyValue !== undefined) {
    return keyValue;
  }
  return undefined;
}

export function evaluateContextKeyWhenExpression(
  expression: string | undefined,
  keys: WhenContextKeyMap
): boolean {
  return evaluateWhenExpression(expression, (token) =>
    resolveContextKeyToken(token, keys)
  );
}

function coercePathValueForWhen(value: unknown): boolean | string | number {
  if (
    typeof value === 'boolean' ||
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return value;
  }
  if (value === null || value === undefined) {
    return false;
  }
  return Boolean(value);
}

export interface PropertyWhenEvalOptions {
  contextKeys: WhenContextKeyMap | Record<string, boolean | string | number>;
  readPath: (path: string) => unknown;
  meta?: PropertyWhenEvalMeta;
}

export type { PropertyWhenEvalMeta } from './properties/property-when-diagnostic';

/**
 * Layout-node `when`: bare tokens = context keys; `$` + path = live property data.
 */
export function evaluatePropertyLayoutWhen(
  expression: string | undefined,
  options: PropertyWhenEvalOptions
): boolean {
  const keyMap =
    options.contextKeys instanceof Map
      ? options.contextKeys
      : new Map(Object.entries(options.contextKeys));

  const resolutions: PropertyWhenTokenResolution[] = [];
  const trackDiagnosis = isEditorDiagnosticsEnabled();

  const result = evaluateWhenExpression(expression, (token) => {
    if (trackDiagnosis) {
      const diagnosis = diagnosePropertyWhenToken(
        token,
        keyMap,
        options.readPath
      );
      if (diagnosis) {
        resolutions.push(diagnosis);
      }
    }
    if (token.startsWith('$')) {
      return coercePathValueForWhen(options.readPath(token.slice(1)));
    }
    const fromKey = resolveContextKeyToken(token, keyMap);
    if (fromKey !== undefined) {
      return fromKey;
    }
    return false;
  });

  if (trackDiagnosis) {
    const contextKeysSample =
      keyMap.size > 0
        ? Object.fromEntries([...keyMap.entries()].slice(0, 12))
        : undefined;
    logPropertyWhenEval(expression, result, resolutions, {
      ...options.meta,
      contextKeyCount: keyMap.size,
      contextKeysSample,
    });
  }

  return result;
}
