import type { ComponentType } from 'react';
import { memo, useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs';
import {
  type CreateInspectorHostContext,
  ViewContainerViews,
} from './view-container-views';

import styles from './secondary-sidebar.module.css';

export interface SecondarySidebarRendererProps {
  createInspectorHostContext?: CreateInspectorHostContext;
  /** Extra view panels from the shell (merged with registered panels). */
  viewPanels?: Record<string, ComponentType>;
}

export const SecondarySidebarRenderer = memo(
  ({
    createInspectorHostContext: createHostContextProp,
    viewPanels: extraViewPanels,
  }: SecondarySidebarRendererProps) => {
    const { api } = useWorkbenchContext();
    const viewContainers = useWorkbenchContextSelector(
      (state) => state.viewContainers
    );
    const activeContainerByLocation = useWorkbenchContextSelector(
      (state) => state.activeContainerByLocation
    );
    const layout = useWorkbenchContextSelector((state) => state.layout);

    const secondaryContainers = useMemo(
      () =>
        (viewContainers ?? []).filter(
          (container) =>
            container.location === 'secondary' &&
            container.sidebarBehavior === 'panel'
        ),
      [viewContainers]
    );

    if (!layout?.secondarySidebar || secondaryContainers.length === 0) {
      return null;
    }

    const activeId =
      activeContainerByLocation?.secondary &&
      secondaryContainers.some(
        (c) => c.id === activeContainerByLocation.secondary
      )
        ? activeContainerByLocation.secondary
        : secondaryContainers[0]!.id;

    if (secondaryContainers.length === 1) {
      return (
        <div className={styles.root}>
          <ViewContainerViews
            container={secondaryContainers[0]!}
            createHostContext={createHostContextProp}
            viewPanels={extraViewPanels}
          />
        </div>
      );
    }

    return (
      <div className={styles.root}>
        <Tabs
          className={styles.tabs}
          onValueChange={(value) => {
            api.setActiveContainer('secondary', value);
          }}
          value={activeId}
        >
          <div className={styles.tabsHeader}>
            <TabsList>
              {secondaryContainers.map((container) => (
                <TabsTrigger key={container.id} value={container.id}>
                  {container.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {secondaryContainers.map((container) => (
            <TabsContent forceMount key={container.id} value={container.id}>
              <ViewContainerViews
                container={container}
                createHostContext={createHostContextProp}
                viewPanels={extraViewPanels}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }
);
