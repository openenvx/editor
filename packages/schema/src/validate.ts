import { cloneDropNulls } from './clone-drop-nulls';
import {
  editorStateSchemaCanonical,
  editorStateSchemaLenient,
  sceneSchemaCanonical,
  sceneSchemaLenient,
  sceneSnapshotSchemaCanonical,
  sceneSnapshotSchemaLenient,
} from './scene-schema';
import type { EditorState, Scene, SceneSnapshot } from './types';

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

function pickSceneSchema(mode: ValidateMode) {
  return mode === 'canonical' ? sceneSchemaCanonical : sceneSchemaLenient;
}

function pickEditorStateSchema(mode: ValidateMode) {
  return mode === 'canonical'
    ? editorStateSchemaCanonical
    : editorStateSchemaLenient;
}

function pickSnapshotSchema(mode: ValidateMode) {
  return mode === 'canonical'
    ? sceneSnapshotSchemaCanonical
    : sceneSnapshotSchemaLenient;
}

function validateSceneShape(scene: Scene): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(scene.pages) || scene.pages.length === 0) {
    errors.push({
      message: 'pages must be a non-empty array',
      path: 'pages',
    });
  }

  return errors;
}

export function validateScene(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): ValidationResult {
  const mode = opts.mode ?? 'partial';
  const result = pickSceneSchema(mode).safeParse(cloneDropNulls(input));
  if (!result.success) {
    return { errors: toErrors(result.error.issues), valid: false };
  }
  const shapeErrors = validateSceneShape(result.data as unknown as Scene);
  return shapeErrors.length === 0
    ? { errors: [], valid: true }
    : { errors: shapeErrors, valid: false };
}

export function assertValidScene(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): void {
  const { valid, errors } = validateScene(input, opts);
  if (!valid) {
    const summary = errors
      .slice(0, 10)
      .map((e) => `  ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid OpenEnvx scene:\n${summary}`);
  }
}

export function parseValidScene(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): Scene {
  assertValidScene(input, opts);
  const mode = opts.mode ?? 'partial';
  const result = pickSceneSchema(mode).safeParse(cloneDropNulls(input));
  return result.data as unknown as Scene;
}

export function validateEditorState(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): ValidationResult {
  const mode = opts.mode ?? 'partial';
  const result = pickEditorStateSchema(mode).safeParse(cloneDropNulls(input));
  return result.success
    ? { errors: [], valid: true }
    : { errors: toErrors(result.error.issues), valid: false };
}

export function validateSceneSnapshot(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): ValidationResult {
  const mode = opts.mode ?? 'partial';
  const result = pickSnapshotSchema(mode).safeParse(cloneDropNulls(input));
  return result.success
    ? { errors: [], valid: true }
    : { errors: toErrors(result.error.issues), valid: false };
}

export function parseValidSceneSnapshot(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): SceneSnapshot {
  const mode = opts.mode ?? 'partial';
  const result = pickSnapshotSchema(mode).safeParse(cloneDropNulls(input));
  if (!result.success) {
    const { errors } = validateSceneSnapshot(input, opts);
    const summary = errors
      .slice(0, 10)
      .map((e) => `  ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid OpenEnvx scene snapshot:\n${summary}`);
  }
  return result.data as unknown as SceneSnapshot;
}

export function parseValidEditorState(
  input: unknown,
  opts: { mode?: ValidateMode } = {}
): EditorState {
  const mode = opts.mode ?? 'partial';
  const result = pickEditorStateSchema(mode).safeParse(cloneDropNulls(input));
  if (!result.success) {
    const { errors } = validateEditorState(input, opts);
    const summary = errors
      .slice(0, 10)
      .map((e) => `  ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid OpenEnvx editor state:\n${summary}`);
  }
  return result.data as unknown as EditorState;
}
