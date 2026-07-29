import { findLayerById } from '@openenvx/core';
import type {
  FieldRendererRegistration,
  InspectorHostContext,
  InspectorPathContextOptions,
  ViewContainerDescriptor,
  ViewDescriptor,
  ViewPanelRegistration,
  WorkbenchApi,
} from '@openenvx/headless';
import { createInspectorHostContext } from '@openenvx/headless';
import type { ComponentType } from 'react';
import { useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { InspectorPanel } from '../layout/inspector-panel';
import { PanelSection } from '../primitives/panel-section';
import { InspectorContentRenderer } from './inspector-content-renderer';
import { ViewPanelRenderer } from './view-panel-renderer';

function defaultInspectorHostContext(
  options: InspectorPathContextOptions
): InspectorHostContext {
  return createInspectorHostContext(options);
}

export type CreateInspectorHostContext = (
  options: InspectorPathContextOptions,
  helpers: {
    api: WorkbenchApi;
    executeCommand: (commandId: string) => Promise<boolean>;
  }
) => InspectorHostContext;

function PropertiesViewBody({
  view,
  createHostContext,
}: {
  view: ViewDescriptor;
  createHostContext?: CreateInspectorHostContext;
}) {
  const { api, executeCommand } = useWorkbenchContext();
  const primaryLayerId = useWorkbenchContextSelector(
    (state) => state.selection.primaryLayerId
  );
  const selectionActivePageId = useWorkbenchContextSelector(
    (state) => state.selection.activePageId
  );
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const fieldRenderers = useWorkbenchContextSelector(
    (state) => state.fieldRenderers
  );

  const layerData = useMemo(() => {
    if (!scene || !primaryLayerId) {
      return null;
    }
    const primaryLayer = findLayerById(scene, primaryLayerId);
    if (
      !primaryLayer ||
      typeof primaryLayer.data !== 'object' ||
      primaryLayer.data === null
    ) {
      return null;
    }
    return primaryLayer.data as Record<string, unknown>;
  }, [primaryLayerId, scene]);

  const hostContext = useMemo(() => {
    const create = createHostContext ?? defaultInspectorHostContext;
    return create(
      {
        activePageId: selectionActivePageId ?? null,
        executeCommand,
        layerData,
        scene: scene!,
        selectedLayerId: primaryLayerId ?? null,
        updateProperty: api.updateProperty,
      },
      { api, executeCommand }
    );
  }, [
    api,
    createHostContext,
    executeCommand,
    layerData,
    primaryLayerId,
    scene,
    selectionActivePageId,
  ]);

  if (view.content.kind !== 'properties' || !scene || !fieldRenderers) {
    return null;
  }

  return (
    <InspectorContentRenderer
      fieldRenderers={fieldRenderers as FieldRendererRegistration[]}
      hostContext={hostContext}
      layerData={layerData ?? {}}
      layerId={primaryLayerId ?? 'inspector'}
      nodes={view.content.nodes}
      onCommand={executeCommand}
    />
  );
}

function ComponentViewBody({
  view,
  viewPanels,
}: {
  view: ViewDescriptor;
  viewPanels: Record<string, ComponentType>;
}) {
  if (view.content.kind !== 'component') {
    return null;
  }
  const Component = viewPanels[view.content.componentId];
  if (!Component) {
    return null;
  }
  return <Component />;
}

function resolveViewPanels(
  registered: ViewPanelRegistration[] | undefined
): Record<string, ComponentType> {
  const map: Record<string, ComponentType> = {};
  for (const entry of registered ?? []) {
    map[entry.id] = entry.Component as ComponentType;
  }
  return map;
}

export function ViewContainerViews({
  container,
  createHostContext,
}: {
  container: ViewContainerDescriptor;
  createHostContext?: CreateInspectorHostContext;
}) {
  const registeredViewPanels = useWorkbenchContextSelector(
    (state) => state.viewPanels
  );
  const viewPanels = useMemo(
    () => resolveViewPanels(registeredViewPanels ?? undefined),
    [registeredViewPanels]
  );

  const treeViews = container.views.filter((v) => v.content.kind === 'tree');
  const otherViews = container.views.filter((v) => v.content.kind !== 'tree');

  if (container.views.length === 0) {
    return <InspectorPanel empty />;
  }

  const treeSection =
    treeViews.length > 0 ? (
      <ViewPanelRenderer
        viewContainers={[{ ...container, views: treeViews }]}
      />
    ) : null;

  const otherSections = otherViews.map((view) => {
    if (view.content.kind === 'properties') {
      return (
        <PanelSection
          collapsible={view.collapsible}
          defaultOpen={!view.initialCollapsed}
          key={view.id}
          title={view.name}
        >
          <PropertiesViewBody
            createHostContext={createHostContext}
            view={view}
          />
        </PanelSection>
      );
    }
    if (view.content.kind === 'component') {
      const showSection = view.collapsible !== false && view.name;
      const body = <ComponentViewBody view={view} viewPanels={viewPanels} />;
      if (!showSection) {
        return <div key={view.id}>{body}</div>;
      }
      return (
        <PanelSection
          collapsible={view.collapsible}
          defaultOpen={!view.initialCollapsed}
          key={view.id}
          title={view.name}
        >
          {body}
        </PanelSection>
      );
    }
    return null;
  });

  if (otherViews.length === 0) {
    return treeSection;
  }

  return (
    <InspectorPanel>
      {treeSection}
      {otherSections}
    </InspectorPanel>
  );
}
