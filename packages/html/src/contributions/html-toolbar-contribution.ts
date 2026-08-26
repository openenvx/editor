import {
  type CommandContext,
  ToolbarContribution,
  type ShellDropdownMenuItemDescriptor,
  type ToolbarBuilder,
} from '@openenvx/core';

import { HTML_ZOOM_PRESETS } from '../editor/html-device-preview';

const HTML_ZOOM_DROPDOWN_ITEMS: ShellDropdownMenuItemDescriptor[] =
  HTML_ZOOM_PRESETS.map((zoom) => ({
    args: { zoom },
    commandId: 'html.zoomPercent',
    label: `${Math.round(zoom * 100)}%`,
  }));

const HTML_PREVIEW_TOOLBAR_WHEN =
  'html.previewActive && !html.hidePreviewToolbar';
const HTML_ZOOM_TOOLBAR_WHEN = `${HTML_PREVIEW_TOOLBAR_WHEN} && !html.hideZoomControls`;

export class HtmlToolbarContribution extends ToolbarContribution {
  contribute(builder: ToolbarBuilder, _ctx: CommandContext): void {
    builder
      .placement('top-center')
      .command('html-toolbar-mobile', {
        args: { preset: 'mobile' },
        commandId: 'html.setDevicePreset',
        icon: 'smartphone',
        labelKey: 'toolbar.deviceMobile',
        priority: 0,
        toggledWhen: "html.devicePreset == 'mobile'",
        when: HTML_PREVIEW_TOOLBAR_WHEN,
      })
      .command('html-toolbar-desktop', {
        args: { preset: 'desktop' },
        commandId: 'html.setDevicePreset',
        icon: 'monitor',
        labelKey: 'toolbar.deviceDesktop',
        priority: 1,
        toggledWhen: "html.devicePreset == 'desktop'",
        when: HTML_PREVIEW_TOOLBAR_WHEN,
      })
      .command('html-toolbar-fluid', {
        args: { preset: 'fluid' },
        commandId: 'html.setDevicePreset',
        icon: 'maximize',
        labelKey: 'toolbar.deviceFluid',
        priority: 2,
        toggledWhen: "html.devicePreset == 'fluid'",
        when: `${HTML_PREVIEW_TOOLBAR_WHEN} && !html.hideFluidPreset`,
      })
      .separator('html-toolbar-sep-1', {
        priority: 10,
        when: HTML_ZOOM_TOOLBAR_WHEN,
      })
      .command('html-toolbar-zoom-out', {
        commandId: 'html.zoomOut',
        icon: 'zoom-out',
        labelKey: 'zoom.out',
        priority: 11,
        when: HTML_ZOOM_TOOLBAR_WHEN,
      })
      .command('html-toolbar-zoom-in', {
        commandId: 'html.zoomIn',
        icon: 'zoom-in',
        labelKey: 'zoom.in',
        priority: 12,
        when: HTML_ZOOM_TOOLBAR_WHEN,
      })
      .separator('html-toolbar-sep-2', {
        priority: 20,
        when: HTML_ZOOM_TOOLBAR_WHEN,
      })
      .dropdown('html-toolbar-zoom', {
        items: HTML_ZOOM_DROPDOWN_ITEMS,
        labelBinding: 'html.zoomLabel',
        priority: 21,
        when: HTML_ZOOM_TOOLBAR_WHEN,
      });
  }
}
