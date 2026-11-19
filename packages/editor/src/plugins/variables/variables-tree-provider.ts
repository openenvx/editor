import {
  documentVariables,
  type TemplateVariable,
} from '@openenvx/editor/schema';
import {
  TreeDataProvider,
  type CommandContext,
  type TreeItem,
} from '@openenvx/studio';

import { requireDocumentStore } from '../../document-store-access';

export class VariablesTreeProvider extends TreeDataProvider<TemplateVariable> {
  getRootChildren(ctx: CommandContext): TemplateVariable[] {
    return documentVariables(requireDocumentStore(ctx).getDocument());
  }

  getChildren(): TemplateVariable[] {
    return [];
  }

  getTreeItem(variable: TemplateVariable, _ctx: CommandContext): TreeItem {
    return {
      actions: [
        {
          commandId: 'variables.edit',
          icon: 'pencil',
          label: 'Edit variable',
        },
      ],
      id: variable.id,
      label: variable.key,
    };
  }
}
