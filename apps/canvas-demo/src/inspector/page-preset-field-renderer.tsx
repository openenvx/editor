import { usePagePresetResize } from '@openenvx/canvas';
import { getActivePage } from '@openenvx/core';
import type { PropertyFieldDescriptor } from '@openenvx/core';
import { useWorkbenchContextSelector } from '@openenvx/headless/react';
import { resolvePagePreset } from '@openenvx/schema';
import { ConfirmDialog, Select } from '@openenvxee/studio';
import { memo, useState } from 'react';

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
    const resizePagePreset = usePagePresetResize();
    const page = scene ? getActivePage(scene) : null;
    const currentPresetId = String(
      value ?? field.options?.[0]?.value ?? 'a4-portrait'
    );
    const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const selectedPresetId = pendingPresetId ?? currentPresetId;
    const pendingPreset = pendingPresetId
      ? resolvePagePreset(pendingPresetId)
      : undefined;

    const handlePresetChange = (presetId: string) => {
      if (presetId === currentPresetId) {
        return;
      }
      setPendingPresetId(presetId);
      setDialogOpen(true);
    };

    const handleCancel = () => {
      setDialogOpen(false);
      setPendingPresetId(null);
    };

    const handleConfirm = () => {
      if (!pendingPresetId) {
        return;
      }
      void resizePagePreset(pendingPresetId);
      setDialogOpen(false);
      setPendingPresetId(null);
    };

    if (!page) {
      return null;
    }

    const currentWidth = Math.round(page.width ?? 0);
    const currentHeight = Math.round(page.height ?? 0);
    const nextWidth = Math.round(pendingPreset?.width ?? currentWidth);
    const nextHeight = Math.round(pendingPreset?.height ?? currentHeight);

    return (
      <>
        <Select
          id={`owb-inspector-${layerId}-${field.key}`}
          onChange={handlePresetChange}
          options={(field.options ?? []).map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          value={selectedPresetId}
        />
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Resize"
          description={`Resize from ${currentWidth} × ${currentHeight} px to ${nextWidth} × ${nextHeight} px? All elements on the page will be scaled.`}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          open={dialogOpen}
          title="Resize page"
        />
      </>
    );
  }
);

PagePresetFieldRenderer.displayName = 'PagePresetFieldRenderer';
