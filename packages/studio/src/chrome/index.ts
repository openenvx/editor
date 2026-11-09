/**
 * Editor driver floating chrome — declarative descriptors + studio renderers.
 */
export type {
  FloatingToolbarColorItem,
  FloatingToolbarCommandItem,
  FloatingToolbarFileItem,
  FloatingToolbarItem,
  FloatingToolbarLabelItem,
  FloatingToolbarMenuItem,
  FloatingToolbarPopoverFieldItem,
  FloatingToolbarSeparatorItem,
  FloatingToolbarToggleItem,
  FloatingSelectionToolbarItem,
} from './floating-toolbar-descriptor';
export {
  FloatingToolbar,
  FloatingToolbarSurface,
  type FloatingToolbarProps,
  type FloatingToolbarSurfaceProps,
} from './floating-toolbar';
export {
  FloatingSelectionToolbar,
  FloatingSelectionToolbarShell,
  type FloatingSelectionToolbarProps,
  type FloatingSelectionToolbarShellProps,
} from './floating-selection-toolbar';
export {
  HiddenFileInput,
  type HiddenFileInputHandle,
  type HiddenFileInputProps,
} from './hidden-file-input';
export { useDocumentTheme } from './use-document-theme';
