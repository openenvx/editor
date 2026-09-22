import type { z } from 'zod';

import type { PropertyFieldDescriptor } from '../builders/property-builder';
import {
  editorDiagnosticLog,
  isEditorDiagnosticsEnabled,
} from '../diagnostics/editor-diagnostics';
import { safeParsePropertyFieldDescriptor } from './property-field-schema';

const PROPERTY_FIELD_SCOPE = 'property.field';

function pathKey(path: PropertyKey[]): string {
  return path.map(String).join('.') || '(root)';
}

function hintForUnrecognizedKey(key: string, kind: string): string | undefined {
  if (key === 'numeric') {
    return 'Use kind: "number", "cornerRadius", "padding", "shadow", or "border", or drop numeric.';
  }
  if (key === 'options') {
    return 'Use kind: "select", "segmented", "align", or "font", or drop options.';
  }
  if (key === 'repeaterFields') {
    return 'Use kind: "repeater", or drop repeaterFields.';
  }
  if (key === 'slotList') {
    return 'Use kind: "slotList", or drop slotList.';
  }
  if (key === 'uploadCommandId') {
    return 'Use kind: "image", or drop uploadCommandId.';
  }
  if (key === 'placeholder' || key === 'maxLength') {
    return 'Use kind: "text" or "richText", or drop placeholder/maxLength.';
  }
  return `Property "${key}" is not used by kind "${kind}".`;
}

function diagnosticLevelForIssue(
  issue: z.core.$ZodIssue
): 'error' | 'warn' | 'info' {
  if (issue.code === 'unrecognized_keys') {
    return 'warn';
  }
  return 'error';
}

function messageForIssue(issue: z.core.$ZodIssue, kind: string): string {
  if (issue.code === 'unrecognized_keys') {
    const keys = issue.keys;
    if (keys.length === 1) {
      return `\`${keys[0]}\` is not used by kind "${kind}"`;
    }
    return `Unrecognized properties for kind "${kind}": ${keys.map((k) => `\`${k}\``).join(', ')}`;
  }
  return issue.message;
}

function logZodIssue(
  field: PropertyFieldDescriptor,
  issue: z.core.$ZodIssue
): void {
  const kind = String(field.kind);
  const level = diagnosticLevelForIssue(issue);
  const path = pathKey(issue.path);
  const message = messageForIssue(issue, kind);
  const data: Record<string, unknown> = {
    key: field.key,
    kind,
    path,
    zodCode: issue.code,
  };
  if (issue.code === 'unrecognized_keys' && issue.keys.length === 1) {
    data.hint = hintForUnrecognizedKey(issue.keys[0]!, kind);
  }
  editorDiagnosticLog(
    PROPERTY_FIELD_SCOPE,
    level,
    message,
    data,
    `field|${kind}|${field.key}|${path}|${issue.code}|${message}`
  );
}

function logImageUploadHint(field: PropertyFieldDescriptor): void {
  if (field.kind !== 'image' || field.uploadCommandId) {
    return;
  }
  editorDiagnosticLog(
    PROPERTY_FIELD_SCOPE,
    'info',
    'Image field has no uploadCommandId - upload affordance will be hidden.',
    { key: field.key, kind: field.kind },
    `field|image|${field.key}|upload-hint`
  );
}

function diagnosePopupFields(field: PropertyFieldDescriptor): void {
  const popupFields = field.popup?.fields;
  if (!popupFields?.length) {
    return;
  }
  for (const sub of popupFields) {
    if (
      typeof sub === 'object' &&
      sub !== null &&
      'key' in sub &&
      'kind' in sub &&
      'label' in sub
    ) {
      diagnosePropertyFieldDescriptor(sub as PropertyFieldDescriptor);
    }
  }
}

/** Runtime field descriptor checks when editor diagnostics are enabled. */
export function diagnosePropertyFieldDescriptor(
  field: PropertyFieldDescriptor
): void {
  if (!isEditorDiagnosticsEnabled()) {
    return;
  }

  const result = safeParsePropertyFieldDescriptor(field);
  if (!result.success) {
    for (const issue of result.error.issues) {
      logZodIssue(field, issue);
    }
  }

  logImageUploadHint(field);
  diagnosePopupFields(field);
}
