import type {
  EditorInput,
  PropertySectionDescriptor,
  Scene,
  Selection,
} from '@openenvx/core';

import type { CommandPaletteDescriptor } from './builders/command-palette-builder';
import type { MenuItemDescriptor } from './builders/menu-builder';
import type { StatusBarItemDescriptor } from './builders/status-bar-builder';
import type { ToolbarItemDescriptor } from './builders/toolbar-builder';
import type { OverlayDescriptor } from './contributions/overlay-contribution';
import type {
  LayerSurfaceItem,
  ViewContainerDescriptor,
} from './workbench-state';
import type { EditorPaneRegistration } from './workbench/editor-pane-host-props';
import type {
  FieldRendererRegistration,
  InspectorPaneRegistration,
} from './workbench/inspector-pane-registration';
import type { StatusBarItemRendererRegistration } from './workbench/status-bar-item-renderer-registration';
import type { WorkbenchLayout } from './workbench/workbench-layout';

export type SliceName = 'scene' | 'editor' | 'chrome' | 'commands';

export interface SceneSlice {
  scene: Scene;
  selection: Selection;
  properties: PropertySectionDescriptor[] | null;
  viewContainers: ViewContainerDescriptor[];
  inspectorPanes: InspectorPaneRegistration[];
  fieldRenderers: FieldRendererRegistration[];
}

export interface EditorSlice {
  layerSurface: LayerSurfaceItem[];
  editorPaneKind: string;
  editorPanes: EditorPaneRegistration[];
  editor: EditorInput | null;
}

export interface ChromeSlice {
  contextMenu: MenuItemDescriptor[];
  commandPalette: CommandPaletteDescriptor;
  overlays: OverlayDescriptor[];
  statusBar: StatusBarItemDescriptor[];
  statusBarItemRenderers: StatusBarItemRendererRegistration[];
  toolbarItems: ToolbarItemDescriptor[];
  contextKeys: Record<string, boolean | string | number>;
}

export interface CommandsSlice {
  commandStates: Record<string, { canExecute: boolean }>;
}

export interface SliceBuilders {
  buildSceneSlice: () => SceneSlice;
  buildEditorSlice: () => EditorSlice;
  buildChromeSlice: () => ChromeSlice;
  buildCommandsSlice: () => CommandsSlice;
}

export class WorkbenchStateCache {
  private sceneSlice: SceneSlice | null = null;
  private editorSlice: EditorSlice | null = null;
  private chromeSlice: ChromeSlice | null = null;
  private commandsSlice: CommandsSlice | null = null;
  private readonly dirty = new Set<SliceName>();
  private lastContentRevision = -1;

  /** Test-only counters for slice rebuilds. */
  readonly rebuildCounts = {
    chrome: 0,
    commands: 0,
    editor: 0,
    scene: 0,
  };

  invalidateAll(): void {
    this.dirty.add('scene');
    this.dirty.add('editor');
    this.dirty.add('chrome');
    this.dirty.add('commands');
  }

  invalidateSceneContent(): void {
    this.dirty.add('scene');
    this.dirty.add('editor');
    this.dirty.add('commands');
  }

  invalidateSelectionOnly(scene: Scene, contentRevision: number): void {
    if (this.sceneSlice && contentRevision === this.lastContentRevision) {
      const patch = { scene, selection: scene.selection };
      this.sceneSlice = { ...this.sceneSlice, ...patch };
    } else {
      this.dirty.add('scene');
    }
    this.dirty.add('editor');
    this.dirty.add('commands');
  }

  invalidateEditor(): void {
    this.dirty.add('editor');
    this.dirty.add('commands');
  }

  invalidateChrome(): void {
    this.dirty.add('chrome');
    this.dirty.add('commands');
  }

  invalidateCommands(): void {
    this.dirty.add('commands');
  }

  onSceneContentRevision(contentRevision: number): void {
    this.lastContentRevision = contentRevision;
  }

  assemble(
    revision: number,
    layout: WorkbenchLayout,
    builders: SliceBuilders
  ): {
    scene: SceneSlice;
    editor: EditorSlice;
    chrome: ChromeSlice;
    commands: CommandsSlice;
  } {
    if (this.dirty.has('scene') || !this.sceneSlice) {
      this.sceneSlice = builders.buildSceneSlice();
      this.rebuildCounts.scene += 1;
    }
    if (this.dirty.has('editor') || !this.editorSlice) {
      this.editorSlice = builders.buildEditorSlice();
      this.rebuildCounts.editor += 1;
    }
    if (this.dirty.has('chrome') || !this.chromeSlice) {
      this.chromeSlice = builders.buildChromeSlice();
      this.rebuildCounts.chrome += 1;
    }
    if (this.dirty.has('commands') || !this.commandsSlice) {
      this.commandsSlice = builders.buildCommandsSlice();
      this.rebuildCounts.commands += 1;
    }

    this.dirty.clear();

    return {
      chrome: this.chromeSlice,
      commands: this.commandsSlice,
      editor: this.editorSlice,
      scene: this.sceneSlice,
    };
  }

  reset(): void {
    this.sceneSlice = null;
    this.editorSlice = null;
    this.chromeSlice = null;
    this.commandsSlice = null;
    this.dirty.clear();
    this.lastContentRevision = -1;
    this.rebuildCounts.chrome = 0;
    this.rebuildCounts.commands = 0;
    this.rebuildCounts.editor = 0;
    this.rebuildCounts.scene = 0;
  }

  /** @internal */
  getSceneSliceForTest(): SceneSlice | null {
    return this.sceneSlice;
  }
}
