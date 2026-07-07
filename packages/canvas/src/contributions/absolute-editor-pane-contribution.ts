import { EditorPaneContribution } from '@openenvx/core';

import { AbsoluteEditorPane } from '../editor/absolute-editor-pane';

export class AbsoluteEditorPaneContribution extends EditorPaneContribution {
  readonly id = 'canvas.absoluteEditorPane';
  readonly editorPaneKind = 'absolute';
  readonly Component = AbsoluteEditorPane;
}
