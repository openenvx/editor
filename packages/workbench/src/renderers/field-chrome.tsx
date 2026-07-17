import type { PropertyFieldDescriptor } from '@openenvx/core';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { WorkbenchIcon } from '../icons/workbench-icon';
import { cn } from '../lib/cn';
import { ColorPickerPanel } from '../primitives/color-picker';
import { IconButton } from '../primitives/icon-button';
import { InspectorAnchoredPopover } from '../primitives/inspector-anchored-popover';
import { InspectorFieldRow } from '../primitives/inspector-field-row';
import { StepperField } from '../primitives/stepper-field';
import { FieldActionsRow } from './field-actions-row';
import { readNestedValue, writeNestedValue } from './nested-field-value';
import { getFieldId } from './property-field-types';
import type { PropertyFieldRendererProps } from './property-field-types';

import styles from '../primitives/inspector-field.module.css';

export interface FieldChromeProps extends Pick<
  PropertyFieldRendererProps,
  | 'field'
  | 'value'
  | 'layerId'
  | 'layerData'
  | 'onUpdate'
  | 'onCommand'
  | 'renderField'
> {
  children: ReactNode;
}

export function FieldChrome({
  field,
  value,
  layerId,
  layerData,
  onUpdate,
  onCommand,
  renderField,
  children,
}: FieldChromeProps) {
  const popup = field.popup?.fields.length ? field.popup : null;
  const actions = field.actions ?? [];
  const hasPopup = popup !== null;
  const hasActions = actions.length > 0;
  const [popupOpen, setPopupOpen] = useState(false);

  if (!hasPopup && !hasActions) {
    return children;
  }

  const popupFields = popup
    ? [...popup.fields].toSorted((a, b) =>
        a.kind === 'color' ? -1 : b.kind === 'color' ? 1 : 0
      )
    : [];

  const inline = hasPopup ? (
    <InspectorAnchoredPopover
      onOpenChange={setPopupOpen}
      open={popupOpen}
      title={popup.title ?? field.label}
      trigger={
        <IconButton
          aria-label={popup.title ?? field.label}
          className={styles.popoverTrigger}
          size="sm"
        >
          {popup.icon ? <WorkbenchIcon id={popup.icon} size={12} /> : null}
        </IconButton>
      }
    >
      {popupFields.map((subField) => {
        const nestedValue = readNestedValue(value, subField.key);
        const popupLayerId = `${layerId}-${field.key}`;
        const popupFieldId = getFieldId(popupLayerId, subField.key);
        const handleSubFieldUpdate = (subValue: unknown) => {
          onUpdate(field.key, writeNestedValue(value, subField.key, subValue));
        };

        if (subField.kind === 'color') {
          return (
            <div className={styles.popupColorField} key={subField.key}>
              <ColorPickerPanel
                id={popupFieldId}
                onChange={(next) => handleSubFieldUpdate(next)}
                value={String(nestedValue ?? 'transparent')}
              />
            </div>
          );
        }

        if (subField.kind === 'number') {
          return (
            <StepperField
              className={styles.popupStepperField}
              icon={
                subField.icon ? (
                  <WorkbenchIcon id={subField.icon} size={14} />
                ) : undefined
              }
              id={popupFieldId}
              key={subField.key}
              label={subField.label}
              max={subField.numeric?.max}
              min={subField.numeric?.min}
              onChange={(next) => handleSubFieldUpdate(next)}
              step={subField.numeric?.step}
              value={Number(nestedValue ?? 0)}
              variant="popup"
            />
          );
        }

        return (
          <InspectorFieldRow
            className={cn(styles.popupField, styles.popupFieldFull)}
            htmlFor={popupFieldId}
            key={subField.key}
            label={subField.label}
          >
            {renderField({
              field: subField as PropertyFieldDescriptor,
              layerData,
              layerId: popupLayerId,
              onCommand,
              onUpdate: (subKey, subValue) => {
                onUpdate(field.key, writeNestedValue(value, subKey, subValue));
              },
              value: nestedValue,
            })}
          </InspectorFieldRow>
        );
      })}
    </InspectorAnchoredPopover>
  ) : null;

  return (
    <div className={styles.controlRow}>
      <div className={styles.inputGrow}>{children}</div>
      {inline}
      {hasActions ? (
        <FieldActionsRow
          actions={actions}
          layerData={layerData}
          onCommand={onCommand}
          onUpdate={onUpdate}
        />
      ) : null}
    </div>
  );
}
