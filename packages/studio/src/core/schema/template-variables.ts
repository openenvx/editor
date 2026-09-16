/**
 * Scene-level template variables: catalog on Scene + `{{{key}}}` tokens in layer data.
 * Orthogonal to Bannerbear-style `applyModifications` (named whole layers).
 */
import {
  hasChildLayers,
  mapLayerChildren,
  walkLayers,
} from '../scene/layer-tree';
import { escapeHtml } from './template';
import type { Layer, Scene, TemplateVariable } from './types';

const VARIABLE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
export const VARIABLE_TOKEN_CAPTURE_RE = /\{\{\{([A-Za-z][A-Za-z0-9_]*)\}\}\}/g;
const TOKEN_CAPTURE_RE = VARIABLE_TOKEN_CAPTURE_RE;

export function isValidVariableKey(key: string): boolean {
  return VARIABLE_KEY_PATTERN.test(key);
}

export function formatVariableToken(key: string): string {
  return `{{{${key}}}}`;
}

export function extractVariableKeys(text: string): string[] {
  const keys: string[] = [];
  for (const match of text.matchAll(TOKEN_CAPTURE_RE)) {
    keys.push(match[1]!);
  }
  return keys;
}

export function sceneVariables(scene: Scene): TemplateVariable[] {
  return scene.variables ?? [];
}

export type VariableKeyValidationReason = 'invalid' | 'duplicate';

export function validateVariableKeyForCatalog(
  variables: TemplateVariable[],
  key: string,
  editingId?: string
): { ok: true } | { ok: false; reason: VariableKeyValidationReason } {
  const trimmed = key.trim();
  if (!isValidVariableKey(trimmed)) {
    return { ok: false, reason: 'invalid' };
  }
  if (
    variables.some((entry) => entry.key === trimmed && entry.id !== editingId)
  ) {
    return { ok: false, reason: 'duplicate' };
  }
  return { ok: true };
}

function shouldEscapeSubstitutedValue(fieldKey: string | undefined): boolean {
  if (!fieldKey) {
    return false;
  }
  if (fieldKey === 'html') {
    return true;
  }
  if (fieldKey.endsWith('Html')) {
    return true;
  }
  return false;
}

function substituteTokensInText(
  text: string,
  values: Record<string, string>,
  escapeValues: boolean
): string {
  return text.replace(TOKEN_CAPTURE_RE, (match, key: string) => {
    if (key in values) {
      const value = values[key]!;
      return escapeValues ? escapeHtml(value) : value;
    }
    return match;
  });
}

function substituteStringsInUnknown(
  value: unknown,
  values: Record<string, string>,
  fieldKey?: string
): unknown {
  if (typeof value === 'string') {
    return substituteTokensInText(
      value,
      values,
      shouldEscapeSubstitutedValue(fieldKey)
    );
  }
  if (Array.isArray(value)) {
    return value.map((entry) => substituteStringsInUnknown(entry, values));
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      next[key] = substituteStringsInUnknown(entry, values, key);
    }
    return next;
  }
  return value;
}

function mapLayerDataStrings(
  layer: Layer,
  values: Record<string, string>
): Layer {
  const nextData = substituteStringsInUnknown(layer.data, values);
  let nextLayer: Layer = {
    ...layer,
    data: nextData as Layer['data'],
  };
  if (hasChildLayers(nextLayer)) {
    nextLayer = mapLayerChildren(nextLayer, (children) =>
      children.map((child) => mapLayerDataStrings(child, values))
    );
  }
  return nextLayer;
}

function mapLayerDataStringsWithMapper(
  layer: Layer,
  mapper: (text: string) => string
): Layer {
  const mapped = substituteStringsInUnknownWithMapper(layer.data, mapper);
  let nextLayer: Layer = {
    ...layer,
    data: mapped as Layer['data'],
  };
  if (hasChildLayers(nextLayer)) {
    nextLayer = mapLayerChildren(nextLayer, (children) =>
      children.map((child) => mapLayerDataStringsWithMapper(child, mapper))
    );
  }
  return nextLayer;
}

function substituteStringsInUnknownWithMapper(
  value: unknown,
  mapper: (text: string) => string
): unknown {
  if (typeof value === 'string') {
    return mapper(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) =>
      substituteStringsInUnknownWithMapper(entry, mapper)
    );
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      next[key] = substituteStringsInUnknownWithMapper(entry, mapper);
    }
    return next;
  }
  return value;
}

function mapSceneLayers(scene: Scene, mapper: (layer: Layer) => Layer): Scene {
  return {
    ...scene,
    pages: scene.pages.map((page) => ({
      ...page,
      layers: page.layers.map((layer) => mapper(layer)),
    })),
    components: scene.components
      ? Object.fromEntries(
          Object.entries(scene.components).map(([id, component]) => [
            id,
            {
              ...component,
              layers: component.layers.map((layer) => mapper(layer)),
            },
          ])
        )
      : scene.components,
  };
}

/** Replace `{{{key}}}` tokens in layer `data` string fields. Unknown keys stay. */
export function applyTemplateVariables(
  scene: Scene,
  values: Record<string, string>
): Scene {
  if (Object.keys(values).length === 0) {
    return scene;
  }
  return mapSceneLayers(structuredClone(scene), (layer) =>
    mapLayerDataStrings(layer, values)
  );
}

/** Rewrite token syntax when a catalog key changes. */
export function rewriteVariableKeyInScene(
  scene: Scene,
  oldKey: string,
  newKey: string
): Scene {
  const oldToken = formatVariableToken(oldKey);
  const newToken = formatVariableToken(newKey);
  const mapper = (text: string) =>
    text.includes(oldToken) ? text.split(oldToken).join(newToken) : text;
  return mapSceneLayers(scene, (layer) =>
    mapLayerDataStringsWithMapper(layer, mapper)
  );
}

export function addVariableToScene(
  scene: Scene,
  variable: TemplateVariable
): Scene {
  return { ...scene, variables: [...sceneVariables(scene), variable] };
}

export function updateVariableInScene(
  scene: Scene,
  id: string,
  patch: { key?: string; label?: string; sample?: string }
): Scene | null {
  const variables = [...sceneVariables(scene)];
  const index = variables.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return null;
  }
  const current = variables[index]!;
  const nextKey = patch.key !== undefined ? patch.key.trim() : current.key;
  const validation = validateVariableKeyForCatalog(variables, nextKey, id);
  if (!validation.ok) {
    return null;
  }
  const nextVariable: TemplateVariable = {
    ...current,
    key: nextKey,
    label:
      patch.label !== undefined
        ? patch.label.trim() || undefined
        : current.label,
    sample: patch.sample !== undefined ? patch.sample : current.sample,
  };
  variables[index] = nextVariable;
  let nextScene: Scene = { ...scene, variables };
  if (nextKey !== current.key) {
    nextScene = rewriteVariableKeyInScene(nextScene, current.key, nextKey);
  }
  return nextScene;
}

export function removeVariableFromScene(scene: Scene, id: string): Scene {
  return {
    ...scene,
    variables: sceneVariables(scene).filter((entry) => entry.id !== id),
  };
}

export function reorderVariablesInScene(
  scene: Scene,
  activeId: string,
  overId: string
): Scene {
  const variables = [...sceneVariables(scene)];
  const from = variables.findIndex((entry) => entry.id === activeId);
  const to = variables.findIndex((entry) => entry.id === overId);
  if (from === -1 || to === -1 || from === to) {
    return scene;
  }
  const [moved] = variables.splice(from, 1);
  variables.splice(to, 0, moved!);
  return { ...scene, variables };
}

export function listVariableUsages(scene: Scene): string[] {
  const keys = new Set<string>();
  const collect = (value: unknown): void => {
    if (typeof value === 'string') {
      for (const key of extractVariableKeys(value)) {
        keys.add(key);
      }
      return;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        collect(entry);
      }
      return;
    }
    if (value && typeof value === 'object') {
      for (const entry of Object.values(value)) {
        collect(entry);
      }
    }
  };

  for (const page of scene.pages) {
    walkLayers(page.layers, (layer) => collect(layer.data));
  }
  if (scene.components) {
    for (const component of Object.values(scene.components)) {
      walkLayers(component.layers, (layer) => collect(layer.data));
    }
  }
  return [...keys];
}

export function buildSampleVariableValues(
  scene: Scene
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const variable of sceneVariables(scene)) {
    if (variable.sample !== undefined) {
      values[variable.key] = variable.sample;
    }
  }
  return values;
}

export function applyTemplateVariablesForPreview(scene: Scene): Scene {
  const values = buildSampleVariableValues(scene);
  if (Object.keys(values).length === 0) {
    return scene;
  }
  return applyTemplateVariables(scene, values);
}

export function createVariableId(): string {
  return `var-${crypto.randomUUID()}`;
}

export function nextVariableKey(variables: TemplateVariable[]): string {
  const used = new Set(variables.map((entry) => entry.key));
  const base = 'variable';
  if (!used.has(base)) {
    return base;
  }
  let index = 2;
  while (used.has(`${base}${index}`)) {
    index += 1;
  }
  return `${base}${index}`;
}

/** True when the variable has a non-empty preview/fallback `sample`. */
export function variableHasFallback(variable: TemplateVariable): boolean {
  return (variable.sample?.trim() ?? '') !== '';
}

/** Global class names for editor-only variable chips (not persisted in scene HTML). */
export const VARIABLE_CHIP_CLASS = 'openenvx-variable-chip';
export const VARIABLE_CHIP_MISSING_CLASS = 'openenvx-variable-chip--missing';
export const VARIABLE_CHIP_TIP_CLASS = 'openenvx-variable-chip-tip';

export interface WrapVariableTokensOptions {
  /** Tooltip shown on hover when fallback is missing or key is unknown. */
  missingTip?: string;
}

export interface VariableChipPresentation {
  className: string;
  title?: string;
}

/** Editor chip classes/title for a token key (static HTML + TipTap decorations). */
export function resolveVariableChipPresentation(
  key: string,
  variables: TemplateVariable[],
  missingTip = ''
): VariableChipPresentation {
  const variable = variables.find((entry) => entry.key === key);
  const hasFallback = variable ? variableHasFallback(variable) : false;
  if (hasFallback) {
    return { className: VARIABLE_CHIP_CLASS };
  }
  return {
    className: `${VARIABLE_CHIP_CLASS} ${VARIABLE_CHIP_MISSING_CLASS}`,
    title: missingTip || undefined,
  };
}

/** Wrap `{{{key}}}` tokens in display-only chip spans. Does not mutate stored HTML. */
export function wrapVariableTokensForDisplay(
  html: string,
  variables: TemplateVariable[],
  options: WrapVariableTokensOptions = {}
): string {
  if (!html.includes('{{{')) {
    return html;
  }
  const missingTip = options.missingTip ?? '';
  return html.replace(TOKEN_CAPTURE_RE, (match, key: string) => {
    const chip = resolveVariableChipPresentation(key, variables, missingTip);
    if (!chip.title) {
      return `<span class="${chip.className}">${match}</span>`;
    }
    const tip = `<span class="${VARIABLE_CHIP_TIP_CLASS}">${escapeHtml(chip.title)}</span>`;
    return `<span class="${chip.className}">${match}${tip}</span>`;
  });
}

/** Primary inline-text field for variable insertion by layer type. */
export function resolvePrimaryTextDataPath(layerType: string): string | null {
  if (layerType === 'email.button') {
    return 'label';
  }
  if (
    layerType === 'canvas.text' ||
    layerType.endsWith('.text') ||
    layerType.endsWith('.heading')
  ) {
    return 'html';
  }
  return null;
}
