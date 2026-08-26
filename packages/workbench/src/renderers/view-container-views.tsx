import {
  findLayerById,
  createPropertyHostContext,
  ContextKeyServiceId,
  evaluatePropertyLayoutWhen,
  PropertyPathResolver,
} from '@openenvx/core';
import type {
  FieldRendererRegistration,
  PropertyHostContext,
  PropertyPathContextOptions,
  ViewContainerDescriptor,
  ViewDescriptor,
  ViewPanelRegistration,
  WorkbenchApi,
} from '@openenvx/core';
import type { ComponentType } from 'react';
import { useCallback, useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useContextKeysRevision } from '../hooks/use-context-key';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { ViewPane } from '../layout/view-pane';
import { PanelSection } from '../primitives/panel-section';
import { ListViewRenderer } from './list-view-renderer';
import { PropertyContentRenderer } from './property-content-renderer';
import { ViewPanelRenderer } from './view-panel-renderer';

import panelSectionStyles from '../primitives/panel-section.module.css';

function defaultPropertyHostContext(
  options: PropertyPathContextOptions
): PropertyHostContext {
  return createPropertyHostContext(options);
}

export type CreatePropertyHostContext = (
  options: PropertyPathContextOptions,
  helpers: {
    api: WorkbenchApi;
    executeCommand: (commandId: string) => Promise<boolean>;
  }
) => PropertyHostContext;

function usePropertiesHostContext(
  createHostContext?: CreatePropertyHostContext
) {
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
    if (!scene) {
      return null;
    }
    const create = createHostContext ?? defaultPropertyHostContext;
    return create(
      {
        activePageId: selectionActivePageId ?? null,
        executeCommand,
        layerData,
        scene,
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

  return {
    executeCommand,
    fieldRenderers,
    hostContext,
    layerData,
    primaryLayerId,
    scene,
  };
}

function PropertiesViewBody({
  view,
  executeCommand,
  fieldRenderers,
  hostContext,
  layerData,
  primaryLayerId,
}: {
  view: ViewDescriptor;
  executeCommand: (commandId: string) => Promise<boolean>;
  fieldRenderers: FieldRendererRegistration[];
  hostContext: PropertyHostContext;
  layerData: Record<string, unknown> | null;
  primaryLayerId: string | null;
}) {
  const { api } = useWorkbenchContext();
  const contextKeysRevision = useContextKeysRevision();

  const evaluateLayoutWhen = useCallback(
    (clause?: string, meta?: { nodeLabel?: string }) => {
      void contextKeysRevision;
      const keys = api.getService(ContextKeyServiceId);
      return evaluatePropertyLayoutWhen(clause, {
        contextKeys: keys?.snapshot() ?? {},
        readPath: (path) => hostContext.readPath(path),
        meta: {
          nodeLabel: meta?.nodeLabel,
          primaryLayerId,
        },
      });
    },
    [api, contextKeysRevision, hostContext, primaryLayerId]
  );

  if (view.content.kind !== 'properties') {
    return null;
  }

  return (
    <PropertyContentRenderer
      evaluateLayoutWhen={evaluateLayoutWhen}
      fieldRenderers={fieldRenderers}
      hostContext={hostContext}
      layerData={layerData ?? {}}
      layerId={primaryLayerId ?? 'inspector'}
      nodes={view.content.nodes}
      onCommand={executeCommand}
    />
  );
}

function PropertiesViewSection({
  view,
  createHostContext,
}: {
  view: ViewDescriptor;
  createHostContext?: CreatePropertyHostContext;
}) {
  const {
    executeCommand,
    fieldRenderers,
    hostContext,
    layerData,
    primaryLayerId,
    scene,
  } = usePropertiesHostContext(createHostContext);

  const headerTogglePath =
    view.content.kind === 'properties' ? view.content.headerToggle : undefined;

  const headerSwitch = useMemo(() => {
    if (!(headerTogglePath && hostContext && scene)) {
      return;
    }
    const resolver = new PropertyPathResolver(hostContext);
    const handle = resolver.resolve(headerTogglePath);
    return {
      ariaLabel: `Toggle ${view.name}`,
      checked: Boolean(handle.read()),
      onChange: (checked: boolean) => {
        handle.write(checked);
      },
    };
  }, [headerTogglePath, hostContext, scene, view.name]);

  if (view.content.kind !== 'properties') {
    return null;
  }

  if (!(scene && fieldRenderers && hostContext)) {
    return view.emptyMessage ? (
      <ViewPane empty emptyMessage={view.emptyMessage} />
    ) : null;
  }

  const body = (
    <PropertiesViewBody
      executeCommand={executeCommand}
      fieldRenderers={fieldRenderers as FieldRendererRegistration[]}
      hostContext={hostContext}
      layerData={layerData}
      primaryLayerId={primaryLayerId}
      view={view}
    />
  );

  if (view.collapsible === false) {
    return (
      <div key={view.id}>
        {headerSwitch ? (
          <PanelSection
            collapsible={false}
            headerSwitch={headerSwitch}
            icon={view.icon}
            title={view.name}
          >
            {body}
          </PanelSection>
        ) : (
          <div className={panelSectionStyles.flatBody}>{body}</div>
        )}
      </div>
    );
  }

  return (
    <PanelSection
      collapsible={view.collapsible}
      defaultOpen={!view.initialCollapsed}
      headerSwitch={headerSwitch}
      icon={view.icon}
      key={view.id}
      title={view.name}
    >
      {body}
    </PanelSection>
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
  createHostContext?: CreatePropertyHostContext;
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
    return <ViewPane empty />;
  }

  const treeSection =
    treeViews.length > 0 ? (
      <ViewPanelRenderer
        viewContainers={[{ ...container, views: treeViews }]}
      />
    ) : null;

  const otherSections = otherViews.flatMap((view, index) => {
    const previousGroup = otherViews[index - 1]?.group;
    const groupHeading =
      view.group && view.group !== previousGroup ? (
        <p
          className={panelSectionStyles.groupHeading}
          key={`group:${view.group}:${view.id}`}
        >
          {view.group}
        </p>
      ) : null;

    if (view.content.kind === 'welcome') {
      return [
        groupHeading,
        <ViewPane empty emptyMessage={view.content.message} key={view.id} />,
      ];
    }
    if (view.content.kind === 'properties') {
      return [
        groupHeading,
        <PropertiesViewSection
          createHostContext={createHostContext}
          key={view.id}
          view={view}
        />,
      ];
    }
    if (view.content.kind === 'component') {
      const showSection = view.collapsible !== false && view.name;
      const body = <ComponentViewBody view={view} viewPanels={viewPanels} />;
      if (!showSection) {
        return [groupHeading, <div key={view.id}>{body}</div>];
      }
      return [
        groupHeading,
        <PanelSection
          collapsible={view.collapsible}
          defaultOpen={!view.initialCollapsed}
          icon={view.icon}
          key={view.id}
          title={view.name}
        >
          {body}
        </PanelSection>,
      ];
    }
    if (view.content.kind === 'list') {
      const body = <ListViewRenderer view={view} />;
      if (view.collapsible === false) {
        return [groupHeading, <div key={view.id}>{body}</div>];
      }
      return [
        groupHeading,
        <PanelSection
          collapsible={view.collapsible}
          defaultOpen={!view.initialCollapsed}
          icon={view.icon}
          key={view.id}
          title={view.name}
        >
          {body}
        </PanelSection>,
      ];
    }
    return [groupHeading];
  });

  if (otherViews.length === 0) {
    return treeSection;
  }

  return (
    <ViewPane>
      {treeSection}
      {otherSections}
    </ViewPane>
  );
}
