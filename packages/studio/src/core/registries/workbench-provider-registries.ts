import type { EditorPaneRegistry } from './editor-pane-registry';
import type { FieldRendererRegistry } from './field-renderer-registry';
import type { StatusBarItemRendererRegistry } from './status-bar-item-renderer-registry';
import type { ViewPanelRegistry } from './view-panel-registry';
import type { ViewProviderRegistry } from './view-provider-registry';

export interface WorkbenchProviderRegistries {
  readonly viewProviderRegistry: ViewProviderRegistry;
  readonly viewPanelRegistry: ViewPanelRegistry;
  readonly fieldRendererRegistry: FieldRendererRegistry;
  readonly statusBarItemRendererRegistry: StatusBarItemRendererRegistry;
  readonly editorPaneRegistry: EditorPaneRegistry;
}
