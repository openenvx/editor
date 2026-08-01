import { CANVAS_GRID_SIZE_PRESETS } from '@openenvx/canvas';
import { findLayerById } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';
import {
  StatusBarContribution,
  ToolbarContribution,
  type ShellDropdownMenuItemDescriptor,
  type StatusBarBuilder,
  type ToolbarBuilder,
} from '@openenvx/headless';

export const CANVAS_ZOOM_DROPDOWN_ITEMS: ShellDropdownMenuItemDescriptor[] = [
  { commandId: 'canvas.zoomIn', labelKey: 'zoom.in', shortcut: '⌘ =' },
  { commandId: 'canvas.zoomOut', labelKey: 'zoom.out', shortcut: '⌘ -' },
  { commandId: 'canvas.zoomTo100', labelKey: 'zoom.to100', shortcut: '⌘ 2' },
  { commandId: 'canvas.zoomToFit', labelKey: 'zoom.toFit', shortcut: '⌘ 1' },
  { commandId: 'canvas.zoomReset', labelKey: 'zoom.reset', shortcut: '⌘ 0' },
];

export const CANVAS_GRID_SIZE_DROPDOWN_ITEMS: ShellDropdownMenuItemDescriptor[] =
  CANVAS_GRID_SIZE_PRESETS.map((size) => ({
    args: { size },
    commandId: 'canvas.setGridSize',
    label: `${size}px`,
  }));

export class CanvasStatusBarContribution extends StatusBarContribution {
  contribute(builder: StatusBarBuilder, ctx: CommandContext): void {
    builder.left().dropdown('canvas-zoom', {
      items: CANVAS_ZOOM_DROPDOWN_ITEMS,
      labelBinding: 'editorZoomPercent',
      labelSuffix: '%',
      priority: -10,
    });

    const scene = ctx.scene.getScene();
    const { selectedLayerIds, primaryLayerId } = ctx.selection;
    if (selectedLayerIds.length !== 1 || !primaryLayerId) {
      return;
    }

    const layer = findLayerById(scene, primaryLayerId);
    if (!layer?.transform) {
      return;
    }

    const label = layer.type
      .replace(/^canvas\./, '')
      .replace(/^\w/, (char) => char.toUpperCase());
    const { width, height } = layer.transform;

    builder
      .right()
      .text(`${label} · ${Math.round(width)} × ${Math.round(height)}`, {
        id: 'canvas-selection',
        priority: 10,
        when: 'scene.layerSelected && !scene.multiSelect && page.layoutAbsolute',
      });
  }
}

export class CanvasToolbarContribution extends ToolbarContribution {
  contribute(builder: ToolbarBuilder, _ctx: CommandContext): void {
    builder
      .command('canvas-toolbar-undo', {
        commandId: 'scene.undo',
        icon: 'undo',
        labelKey: 'toolbar.undo',
        priority: 0,
      })
      .command('canvas-toolbar-redo', {
        commandId: 'scene.redo',
        icon: 'redo',
        labelKey: 'toolbar.redo',
        priority: 1,
      })
      .separator('canvas-toolbar-separator-1', { priority: 2 })
      .command('canvas-toolbar-text', {
        commandId: 'canvas.insertText',
        icon: 'text',
        labelKey: 'toolbar.textTool',
        priority: 10,
      })
      .command('canvas-toolbar-image', {
        commandId: 'canvas.insertImage',
        icon: 'image',
        labelKey: 'toolbar.imageTool',
        priority: 11,
      })
      .command('canvas-toolbar-qr', {
        commandId: 'canvas.insertQr',
        icon: 'qr-code',
        labelKey: 'toolbar.qrTool',
        priority: 12,
      })
      .separator('canvas-toolbar-separator-2', { priority: 20 })
      .command('canvas-toolbar-grid', {
        commandId: 'canvas.toggleGrid',
        icon: 'grid',
        labelKey: 'toolbar.grid',
        priority: 20,
      })
      .dropdown('canvas-toolbar-grid-size', {
        items: CANVAS_GRID_SIZE_DROPDOWN_ITEMS,
        labelKey: 'toolbar.gridSize',
        priority: 20.5,
      })
      .command('canvas-toolbar-rulers', {
        commandId: 'canvas.toggleRulers',
        icon: 'ruler',
        labelKey: 'toolbar.rulers',
        priority: 21,
      })
      .dropdown('canvas-toolbar-zoom', {
        items: CANVAS_ZOOM_DROPDOWN_ITEMS,
        labelBinding: 'editorZoomPercent',
        labelSuffix: '%',
        priority: 22,
        when: 'workbench.floatingToolbar',
      });
  }
}
