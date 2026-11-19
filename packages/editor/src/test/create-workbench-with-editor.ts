import type { ProjectSnapshot } from '@openenvx/editor/schema';
import { WorkbenchController } from '@openenvx/studio';
import type { Plugin } from '@openenvx/studio';

import { createEditorPlugins } from '../create-editor-plugins';

export function createWorkbenchWithEditor(
  snapshot: ProjectSnapshot,
  extraPlugins: Plugin[] = []
): WorkbenchController {
  const { plugins, sliceBuilders } = createEditorPlugins({
    document: snapshot.document,
    session: snapshot.session,
  });
  return new WorkbenchController({
    plugins: [...extraPlugins, ...plugins],
    sliceBuilders,
  });
}
