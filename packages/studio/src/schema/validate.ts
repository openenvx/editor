import { cloneDropNulls } from './clone-drop-nulls';
import {
  documentSchemaCanonical,
  documentSchemaLenient,
  editorSessionSchemaCanonical,
  editorSessionSchemaLenient,
  projectSnapshotSchemaCanonical,
  projectSnapshotSchemaLenient,
} from './document-schema';
import type { Document, EditorSession, ProjectSnapshot } from './types';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export type ValidateMode = 'partial' | 'canonical';

function toErrors(
  issues: { path: PropertyKey[]; message: string }[]
): ValidationError[] {
  return issues.map((issue) => ({
    message: issue.message,
    path: issue.path.map(String).join('.'),
  }));
}

function pickDocumentSchema(mode: ValidateMode) {
  return mode === 'canonical' ? documentSchemaCanonical : documentSchemaLenient;
}

function pickEditorSessionSchema(mode: ValidateMode) {
  return mode === 'canonical'
    ? editorSessionSchemaCanonical
    : editorSessionSchemaLenient;
}

function pickSnapshotSchema(mode: ValidateMode) {
  return mode === 'canonical'
    ? projectSnapshotSchemaCanonical
    : projectSnapshotSchemaLenient;
}

function validateDocumentShape(document: Document): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(document.artboards) || document.artboards.length === 0) {
    errors.push({
      message: 'artboards must be a non-empty array',
      path: 'artboards',
    });
  }

  return errors;
}

export function validateDocument(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): ValidationResult {
  const mode = opts.mode ?? 'partial';
  const result = pickDocumentSchema(mode).safeParse(cloneDropNulls(input));
  if (!result.success) {
    return { errors: toErrors(result.error.issues), valid: false };
  }
  const shapeErrors = validateDocumentShape(result.data as unknown as Document);
  return shapeErrors.length === 0
    ? { errors: [], valid: true }
    : { errors: shapeErrors, valid: false };
}

/** @deprecated use validateDocument */
export const validateScene = validateDocument;

export function assertValidDocument(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): void {
  const { valid, errors } = validateDocument(input, opts);
  if (!valid) {
    const summary = errors
      .slice(0, 10)
      .map((e) => `  ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid OpenEnvx document:\n${summary}`);
  }
}

/** @deprecated use assertValidDocument */
export const assertValidScene = assertValidDocument;

export function parseValidDocument(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): Document {
  assertValidDocument(input, opts);
  const mode = opts.mode ?? 'partial';
  const result = pickDocumentSchema(mode).safeParse(cloneDropNulls(input));
  return result.data as unknown as Document;
}

/** @deprecated use parseValidDocument */
export const parseValidScene = parseValidDocument;

export function validateEditorSession(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): ValidationResult {
  const mode = opts.mode ?? 'partial';
  const result = pickEditorSessionSchema(mode).safeParse(cloneDropNulls(input));
  return result.success
    ? { errors: [], valid: true }
    : { errors: toErrors(result.error.issues), valid: false };
}

/** @deprecated use validateEditorSession */
export const validateEditorState = validateEditorSession;

export function validateProjectSnapshot(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): ValidationResult {
  const mode = opts.mode ?? 'partial';
  const result = pickSnapshotSchema(mode).safeParse(cloneDropNulls(input));
  return result.success
    ? { errors: [], valid: true }
    : { errors: toErrors(result.error.issues), valid: false };
}

/** @deprecated use validateProjectSnapshot */
export const validateSceneSnapshot = validateProjectSnapshot;

export function parseValidProjectSnapshot(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): ProjectSnapshot {
  const mode = opts.mode ?? 'partial';
  const result = pickSnapshotSchema(mode).safeParse(cloneDropNulls(input));
  if (!result.success) {
    const { errors } = validateProjectSnapshot(input, opts);
    const summary = errors
      .slice(0, 10)
      .map((e) => `  ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid OpenEnvx project snapshot:\n${summary}`);
  }
  return result.data as unknown as ProjectSnapshot;
}

/** @deprecated use parseValidProjectSnapshot */
export const parseValidSceneSnapshot = parseValidProjectSnapshot;

export function parseValidEditorSession(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): EditorSession {
  const mode = opts.mode ?? 'partial';
  const result = pickEditorSessionSchema(mode).safeParse(cloneDropNulls(input));
  if (!result.success) {
    const { errors } = validateEditorSession(input, opts);
    const summary = errors
      .slice(0, 10)
      .map((e) => `  ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid OpenEnvx editor session:\n${summary}`);
  }
  return result.data as unknown as EditorSession;
}

/** @deprecated use parseValidEditorSession */
export const parseValidEditorState = parseValidEditorSession;
