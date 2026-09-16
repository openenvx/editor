import {
  editorDiagnosticLog,
  isEditorDiagnosticsEnabled,
} from '../diagnostics/editor-diagnostics';
import {
  looksLikePropertyPathToken,
  suggestPropertyWhenTokens,
} from './suggest-property-when-token';

export interface PropertyWhenTokenResolution {
  token: string;
  kind: 'contextKey' | 'path' | 'missingContextKey' | 'missingPath';
  value?: boolean | string | number;
  rawPathValue?: unknown;
  suggestions?: string[];
}

export interface PropertyWhenEvalMeta {
  nodeLabel?: string;
  primaryLayerId?: string | null;
  contextKeyCount?: number;
  contextKeysSample?: Record<string, boolean | string | number>;
}

function contextKeyNames(
  keyMap: Map<string, boolean | string | number>
): string[] {
  return [...keyMap.keys()];
}

export function diagnosePropertyWhenToken(
  token: string,
  keyMap: Map<string, boolean | string | number>,
  readPath: (path: string) => unknown
): PropertyWhenTokenResolution | null {
  if (!isEditorDiagnosticsEnabled()) {
    return null;
  }
  if (
    token.startsWith("'") ||
    token.startsWith('"') ||
    token === 'true' ||
    token === 'false'
  ) {
    return null;
  }

  if (token.startsWith('$')) {
    const path = token.slice(1);
    const raw = readPath(path);
    if (raw === undefined) {
      const suggestions = looksLikePropertyPathToken(path)
        ? []
        : suggestPropertyWhenTokens(path, contextKeyNames(keyMap));
      const shortKeyHint =
        path.length > 0 &&
        !path.includes('.') &&
        !path.startsWith('selection.') &&
        !path.startsWith('scene.')
          ? `PropertyPath.when() needs a full PropertyPath (e.g. PropertyPath.layerById('layer-id', '${path}')), not just the data key.`
          : undefined;
      editorDiagnosticLog(
        'property.when',
        'warn',
        `Property path not resolved: ${path}`,
        {
          path,
          hint:
            shortKeyHint ??
            'Check layer id exists in the scene and the data key is correct.',
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        },
        `path-missing|${path}`
      );
      return {
        token,
        kind: 'missingPath',
        rawPathValue: raw,
        suggestions,
      };
    }
    return {
      token,
      kind: 'path',
      value:
        typeof raw === 'boolean' ||
        typeof raw === 'string' ||
        typeof raw === 'number'
          ? raw
          : Boolean(raw),
      rawPathValue: raw,
    };
  }

  const keyValue = keyMap.get(token);
  if (keyValue !== undefined) {
    return { token, kind: 'contextKey', value: keyValue };
  }

  if (looksLikePropertyPathToken(token)) {
    editorDiagnosticLog(
      'property.when',
      'warn',
      `Token "${token}" was treated as a context key (missing). Property data uses a $ prefix.`,
      {
        token,
        didYouMean: [`$${token}`],
      },
      `bare-path|${token}`
    );
    return {
      token,
      kind: 'missingContextKey',
      suggestions: [`$${token}`],
    };
  }

  const suggestions = suggestPropertyWhenTokens(token, contextKeyNames(keyMap));
  if (suggestions.length > 0) {
    editorDiagnosticLog(
      'property.when',
      'warn',
      `Unknown context key: ${token}`,
      { token, didYouMean: suggestions },
      `ctx-missing|${token}`
    );
  }
  return {
    token,
    kind: 'missingContextKey',
    suggestions,
  };
}

export function logPropertyWhenEval(
  clause: string | undefined,
  result: boolean,
  resolutions: PropertyWhenTokenResolution[],
  meta?: PropertyWhenEvalMeta
): void {
  if (!isEditorDiagnosticsEnabled() || !clause?.trim()) {
    return;
  }
  const visibility = result ? 'visible' : 'hidden';
  editorDiagnosticLog(
    'property.when',
    'info',
    meta?.nodeLabel
      ? `Layout ${visibility}: ${meta.nodeLabel}`
      : `Layout when → ${visibility}`,
    {
      clause,
      result,
      visibility,
      nodeLabel: meta?.nodeLabel,
      primaryLayerId: meta?.primaryLayerId,
      contextKeyCount: meta?.contextKeyCount,
      contextKeysSample: meta?.contextKeysSample,
      tokenResolutions: resolutions,
    },
    `eval|${meta?.nodeLabel ?? ''}|${clause}|${result}`
  );
}
