import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { WorkbenchProvider } from '../context/workbench-context';
import { createMockWorkbenchApi } from '../test/mock-workbench-context';
import { WorkbenchLayersView } from '../views/workbench-chrome-contributions';
import { ViewPanelRenderer } from './view-panel-renderer';

afterEach(cleanup);

describe('ViewPanelRenderer', () => {
  it('skips the nested section title when a tree view is not collapsible', () => {
    const { api } = createMockWorkbenchApi({
      scene: {
        schemaVersion: 1 as never,
        pages: [
          {
            id: 'p1',
            name: 'Menu',
            layout: 'html',
            layers: [
              {
                id: 'root',
                type: 'html.root',
                data: { children: [] },
              },
            ],
          },
        ],
      } as never,
      selection: {
        activePageId: 'p1',
        primaryLayerId: null,
        selectedLayerIds: [],
      },
    });

    render(
      <WorkbenchProvider api={api}>
        <ViewPanelRenderer
          viewContainers={[
            {
              id: 'workbench.sidebar',
              title: 'Layers',
              icon: 'layers',
              location: 'primary',
              views: [
                {
                  id: 'workbench.pages',
                  name: 'Pages',
                  containerId: 'workbench.sidebar',
                  collapsible: true,
                  initialCollapsed: false,
                  supportsReorder: false,
                  viewOrder: 0,
                  viewSelection: 'page',
                  viewHover: 'none',
                  content: {
                    kind: 'tree',
                    items: [
                      {
                        id: 'p1',
                        label: 'Menu',
                        depth: 0,
                        hasChildren: false,
                        source: { id: 'p1' },
                      },
                    ],
                  },
                },
                {
                  id: 'workbench.layers',
                  name: 'Layers',
                  containerId: 'workbench.sidebar',
                  collapsible: false,
                  initialCollapsed: false,
                  supportsReorder: false,
                  viewOrder: 10,
                  viewSelection: 'layer',
                  viewHover: 'layer',
                  content: {
                    kind: 'tree',
                    items: [
                      {
                        id: 'root',
                        label: 'Page',
                        depth: 0,
                        hasChildren: false,
                        source: { id: 'root' },
                      },
                    ],
                  },
                },
              ],
            },
          ]}
        />
      </WorkbenchProvider>
    );

    expect(screen.getByText('Pages')).toBeTruthy();
    expect(screen.getByText('Menu')).toBeTruthy();
    expect(screen.getByText('Page')).toBeTruthy();
    // Nested "Layers" section header must not wrap the layer tree.
    expect(screen.queryAllByText('Layers')).toHaveLength(0);
  });
});

describe('WorkbenchLayersView', () => {
  it('is not collapsible so the document root is the tree root under the container', () => {
    expect(new WorkbenchLayersView().collapsible).toBe(false);
  });
});
