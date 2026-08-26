import { createContributionBuildContext } from '../backbone';
import {
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
  type CommandContext,
  type TreeItem,
} from '../contributions/view-contribution';
import { ViewProviderRegistryImpl } from '../registries/view-provider-registry';
import { ViewLocationService } from '../workbench/view-location-service';
import { describe, expect, it } from 'vitest';

import { buildViewContainer } from './view-descriptor-builder';

class CatalogView extends ViewContribution {
  readonly id = 'catalog.list';
  readonly containerId = 'catalog';
  readonly name = 'Catalog';
  readonly presentation = 'list' as const;
  readonly emptyMessage = 'No items yet.';
  readonly addCommandId = 'catalog.add';
}

class TreeView extends ViewContribution {
  readonly id = 'catalog.tree';
  readonly containerId = 'catalog';
  readonly name = 'Tree';
}

class WelcomeOnlyView extends ViewContribution {
  readonly id = 'catalog.welcome';
  readonly containerId = 'catalog';
  readonly name = 'Welcome';
  readonly emptyMessage = 'Nothing here.';
}

class CatalogContainer extends ViewContainerContribution {
  readonly id = 'catalog';
  readonly title = 'Catalog';
}

interface CatalogNode {
  id: string;
  label: string;
}

class CatalogProvider extends TreeDataProvider<CatalogNode> {
  getRootChildren(): CatalogNode[] {
    return [{ id: 'a', label: 'Alpha' }];
  }

  getChildren(): CatalogNode[] {
    return [];
  }

  getTreeItem(node: CatalogNode): TreeItem {
    return { id: node.id, label: node.label };
  }
}

const noopCtx = {} as CommandContext;
const buildCtx = createContributionBuildContext(
  { has: () => false, get: () => {
    throw new Error('unexpected service');
  } } as never,
  () => true
);

describe('buildViewContainer', () => {
  it('binds list presentation from TreeDataProvider even when emptyMessage is set', () => {
    const registry = new ViewProviderRegistryImpl();
    registry.registerTreeDataProvider('catalog.list', new CatalogProvider());
    const locationService = new ViewLocationService();

    const container = buildViewContainer(
      new CatalogContainer(),
      [new CatalogView()],
      registry,
      noopCtx,
      () => true,
      buildCtx,
      locationService
    );

    const view = container.views[0]!;
    expect(view.content.kind).toBe('list');
    expect(view.content).toMatchObject({
      kind: 'list',
      items: [{ id: 'a', label: 'Alpha', depth: 0, hasChildren: false }],
    });
    expect(view.emptyMessage).toBe('No items yet.');
    expect(view.addCommandId).toBe('catalog.add');
  });

  it('uses tree presentation by default', () => {
    const registry = new ViewProviderRegistryImpl();
    registry.registerTreeDataProvider('catalog.tree', new CatalogProvider());
    const locationService = new ViewLocationService();

    const container = buildViewContainer(
      new CatalogContainer(),
      [new TreeView()],
      registry,
      noopCtx,
      () => true,
      buildCtx,
      locationService
    );

    expect(container.views[0]!.content.kind).toBe('tree');
  });

  it('renders welcome only when there is no provider', () => {
    const registry = new ViewProviderRegistryImpl();
    const locationService = new ViewLocationService();

    const container = buildViewContainer(
      new CatalogContainer(),
      [new WelcomeOnlyView()],
      registry,
      noopCtx,
      () => true,
      buildCtx,
      locationService
    );

    expect(container.views[0]!.content).toEqual({
      kind: 'welcome',
      message: 'Nothing here.',
    });
  });
});
