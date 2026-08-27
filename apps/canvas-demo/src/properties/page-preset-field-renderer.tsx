import { resolvePagePreset, usePagePresetResize } from '@openenvx/canvas';
import { getActivePage } from '@openenvx/core';
import type { PropertyFieldDescriptor } from '@openenvx/core';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/core/react';
import { Select } from '@openenvx/workbench';
import { memo } from 'react';

export interface PagePresetFieldRendererProps {
  field: PropertyFieldDescriptor;
  value: unknown;
  layerId: string;
  onCommand: (commandId: string) => void;
}

export const PagePresetFieldRenderer = memo(
  ({
    field,
    value,
    layerId,
    onCommand: _onCommand,
  }: PagePresetFieldRendererProps) => {
    const scene = useWorkbenchContextSelector((state) => state.scene);
    const { api } = useWorkbenchContext();
    const resizePagePreset = usePagePresetResize();
    const page = scene ? getActivePage(scene) : null;
    const currentPresetId = String(
      value ?? field.options?.[0]?.value ?? 'a4-portrait'
    );

    const handlePresetChange = async (presetId: string) => {
      if (!page || presetId === currentPresetId) {
        return;
      }
      const preset = resolvePagePreset(presetId);
      const currentWidth = Math.round(page.width ?? 0);
      const currentHeight = Math.round(page.height ?? 0);
      const nextWidth = Math.round(preset?.width ?? currentWidth);
      const nextHeight = Math.round(preset?.height ?? currentHeight);
      const ok = await api.showConfirm({
        cancelLabel: 'Cancel',
        confirmLabel: 'Resize',
        description: `Resize from ${currentWidth} × ${currentHeight} px to ${nextWidth} × ${nextHeight} px? All elements on the page will be scaled.`,
        title: 'Resize page',
      });
      if (ok) {
        void resizePagePreset(presetId);
      }
    };

    if (!page) {
      return null;
    }

    return (
      <Select
        id={`owb-inspector-${layerId}-${field.key}`}
        onChange={(presetId) => {
          void handlePresetChange(presetId);
        }}
        options={(field.options ?? []).map((option) => ({
          label: option.label,
          value: option.value,
        }))}
        value={currentPresetId}
      />
    );
  }
);

PagePresetFieldRenderer.displayName = 'PagePresetFieldRenderer';
