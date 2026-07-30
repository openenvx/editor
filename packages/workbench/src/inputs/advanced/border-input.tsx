import type { FieldAction } from '@openenvx/core';

import { WorkbenchIcon } from '../../icons/workbench-icon';
import { IconButton } from '../../primitives/icon-button';
import { FieldActionsRow } from '../../renderers/field-actions-row';
import { NumericControl } from '../basic/numeric-control';
import type { NumericFieldLike } from '../types';
import { ColorInput } from './color-input';

import propertyFieldStyles from '../../primitives/property-field.module.css';

export interface BorderInputProps {
  field: NumericFieldLike;
  value: unknown;
  id: string;
  stroke: string;
  actions?: FieldAction[];
  layerData: Record<string, unknown>;
  onBorderChange: (value: number) => void;
  onStrokeChange: (value: string) => void;
  onCommand: (commandId: string) => void;
  onUpdate: (key: string, value: unknown) => void;
}

export function BorderInput({
  field,
  value,
  id,
  stroke,
  actions,
  layerData,
  onBorderChange,
  onStrokeChange,
  onCommand,
  onUpdate,
}: BorderInputProps) {
  return (
    <div className={propertyFieldStyles.controlRow}>
      <div className={propertyFieldStyles.inputGrow}>
        <NumericControl
          field={field}
          id={id}
          onChange={onBorderChange}
          value={value}
        />
      </div>
      <ColorInput onChange={onStrokeChange} value={stroke} />
      {actions?.length ? (
        <FieldActionsRow
          actions={actions}
          layerData={layerData}
          onCommand={onCommand}
          onUpdate={onUpdate}
        />
      ) : (
        <IconButton
          aria-label="Clear border"
          className={propertyFieldStyles.iconAction}
          onClick={() => {
            onBorderChange(0);
            onStrokeChange('transparent');
          }}
          size="sm"
        >
          <WorkbenchIcon id="x" size={12} />
        </IconButton>
      )}
    </div>
  );
}
