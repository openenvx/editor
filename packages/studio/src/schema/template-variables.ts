/**
 * Document-level template variables: catalog on Document + `{{{key}}}` tokens in node props.
 */
import {
  hasChildNodesInTree,
  mapNodeChildren,
  walkNodes,
} from '../scene/layer-tree';
import { escapeHtml } from './template';
import type { Document, DocumentNode, TemplateVariable } from './types';

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

export function documentVariables(document: Document): TemplateVariable[] {
  return document.variables ?? [];
}

/** @deprecated use documentVariables */
export const sceneVariables = documentVariables;

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

function mapNodePropStrings(
  node: DocumentNode,
  values: Record<string, string>
): DocumentNode {
  const nextProps = substituteStringsInUnknown(node.props ?? {}, values);
  let nextNode: DocumentNode = {
    ...node,
    props: nextProps as Record<string, unknown>,
  };
  if (hasChildNodesInTree(nextNode)) {
    nextNode = mapNodeChildren(nextNode, (children) =>
      children.map((child) => mapNodePropStrings(child, values))
    );
  }
  return nextNode;
}

function mapNodePropStringsWithMapper(
  node: DocumentNode,
  mapper: (text: string) => string
): DocumentNode {
  const mapped = substituteStringsInUnknownWithMapper(node.props ?? {}, mapper);
  let nextNode: DocumentNode = {
    ...node,
    props: mapped as Record<string, unknown>,
  };
  if (hasChildNodesInTree(nextNode)) {
    nextNode = mapNodeChildren(nextNode, (children) =>
      children.map((child) => mapNodePropStringsWithMapper(child, mapper))
    );
  }
  return nextNode;
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

function mapDocumentNodes(
  document: Document,
  mapper: (node: DocumentNode) => DocumentNode
): Document {
  return {
    ...document,
    artboards: document.artboards.map((artboard) => ({
      ...artboard,
      nodes: artboard.nodes.map((node) => mapper(node)),
    })),
    components: document.components
      ? Object.fromEntries(
          Object.entries(document.components).map(([id, component]) => [
            id,
            {
              ...component,
              nodes: component.nodes.map((node) => mapper(node)),
            },
          ])
        )
      : document.components,
  };
}

export function applyTemplateVariables(
  document: Document,
  values: Record<string, string>
): Document {
  if (Object.keys(values).length === 0) {
    return document;
  }
  return mapDocumentNodes(structuredClone(document), (node) =>
    mapNodePropStrings(node, values)
  );
}

export function rewriteVariableKeyInDocument(
  document: Document,
  oldKey: string,
  newKey: string
): Document {
  const oldToken = formatVariableToken(oldKey);
  const newToken = formatVariableToken(newKey);
  const mapper = (text: string) =>
    text.includes(oldToken) ? text.split(oldToken).join(newToken) : text;
  return mapDocumentNodes(document, (node) =>
    mapNodePropStringsWithMapper(node, mapper)
  );
}

/** @deprecated use rewriteVariableKeyInDocument */
export const rewriteVariableKeyInScene = rewriteVariableKeyInDocument;

export function addVariableToDocument(
  document: Document,
  variable: TemplateVariable
): Document {
  return {
    ...document,
    variables: [...documentVariables(document), variable],
  };
}

/** @deprecated use addVariableToDocument */
export const addVariableToScene = addVariableToDocument;

export function updateVariableInDocument(
  document: Document,
  id: string,
  patch: { key?: string; sample?: string }
): Document | null {
  const variables = [...documentVariables(document)];
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
    sample: patch.sample !== undefined ? patch.sample : current.sample,
  };
  variables[index] = nextVariable;
  let nextDocument: Document = { ...document, variables };
  if (nextKey !== current.key) {
    nextDocument = rewriteVariableKeyInDocument(
      nextDocument,
      current.key,
      nextKey
    );
  }
  return nextDocument;
}

/** @deprecated use updateVariableInDocument */
export const updateVariableInScene = updateVariableInDocument;

export function removeVariableFromDocument(
  document: Document,
  id: string
): Document {
  return {
    ...document,
    variables: documentVariables(document).filter((entry) => entry.id !== id),
  };
}

/** @deprecated use removeVariableFromDocument */
export const removeVariableFromScene = removeVariableFromDocument;

export function reorderVariablesInDocument(
  document: Document,
  activeId: string,
  overId: string
): Document {
  const variables = [...documentVariables(document)];
  const from = variables.findIndex((entry) => entry.id === activeId);
  const to = variables.findIndex((entry) => entry.id === overId);
  if (from === -1 || to === -1 || from === to) {
    return document;
  }
  const [moved] = variables.splice(from, 1);
  variables.splice(to, 0, moved!);
  return { ...document, variables };
}

/** @deprecated use reorderVariablesInDocument */
export const reorderVariablesInScene = reorderVariablesInDocument;

export function listVariableUsages(document: Document): string[] {
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

  for (const artboard of document.artboards) {
    walkNodes(artboard.nodes, (node) => collect(node.props));
  }
  if (document.components) {
    for (const component of Object.values(document.components)) {
      walkNodes(component.nodes, (node) => collect(node.props));
    }
  }
  return [...keys];
}

export function buildSampleVariableValues(
  document: Document
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const variable of documentVariables(document)) {
    if (variable.sample !== undefined) {
      values[variable.key] = variable.sample;
    }
  }
  return values;
}

export function applyTemplateVariablesForPreview(document: Document): Document {
  const values = buildSampleVariableValues(document);
  if (Object.keys(values).length === 0) {
    return document;
  }
  return applyTemplateVariables(document, values);
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

export function variableHasFallback(variable: TemplateVariable): boolean {
  return (variable.sample?.trim() ?? '') !== '';
}

export const VARIABLE_CHIP_CLASS = 'openenvx-variable-chip';
export const VARIABLE_CHIP_MISSING_CLASS = 'openenvx-variable-chip--missing';
export const VARIABLE_CHIP_TIP_CLASS = 'openenvx-variable-chip-tip';

export interface WrapVariableTokensOptions {
  missingTip?: string;
}

export interface VariableChipPresentation {
  className: string;
  title?: string;
}

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

export function resolvePrimaryTextPropPath(nodeType: string): string | null {
  if (nodeType === 'email.button') {
    return 'label';
  }
  if (
    nodeType === 'canvas.text' ||
    nodeType.endsWith('.text') ||
    nodeType.endsWith('.heading')
  ) {
    return 'html';
  }
  return null;
}

/** @deprecated use resolvePrimaryTextPropPath */
export const resolvePrimaryTextDataPath = resolvePrimaryTextPropPath;
