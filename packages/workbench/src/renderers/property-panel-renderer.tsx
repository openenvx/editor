import type {
  FieldRendererRegistration,
  InspectorPaneRegistration,
  InspectorHostContext,
  InspectorPathContextOptions,
  WorkbenchApi,
} from '@openenvx/headless';
import { createInspectorHostContext } from '@openenvx/headless';
import { memo, useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { InspectorPanel } from '../layout/inspector-panel';
import { PanelSection } from '../primitives/panel-section';
import { InspectorContentRenderer } from './inspector-content-renderer';

function defaultInspectorHostContext(
  options: InspectorPathContextOptions
): InspectorHostContext {
  return createInspectorHostContext(options);
}

interface Props {
  selectedLayerId: string | null;
  layerData: Record<string, unknown> | null;
  inspectorPanes: InspectorPaneRegistration[];
  fieldRenderers: FieldRendererRegistration[];
  createInspectorHostContext?: (
    options: InspectorPathContextOptions,
    helpers: {
      api: WorkbenchApi;
      executeCommand: (commandId: string) => Promise<boolean>;
    }
  ) => InspectorHostContext;
}

export const PropertyPanelRenderer = memo(
  ({
    selectedLayerId,
    layerData,
    inspectorPanes,
    fieldRenderers,
    createInspectorHostContext: createHostContext = defaultInspectorHostContext,
  }: Props) => {
    const { api, executeCommand } = useWorkbenchContext();
    const scene = useWorkbenchContextSelector((state) => state.scene);

    const sortedPanes = useMemo(
      () =>
        inspectorPanes.toSorted(
          (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
        ),
      [inspectorPanes]
    );

    const hostContext = useMemo(
      () =>
        createHostContext(
          {
            executeCommand,
            layerData,
            scene: scene!,
            selectedLayerId,
            updateProperty: api.updateProperty,
          },
          { api, executeCommand }
        ),
      [
        api,
        createHostContext,
        executeCommand,
        layerData,
        selectedLayerId,
        scene,
      ]
    );

    if (!scene) {
      return <InspectorPanel empty />;
    }

    if (sortedPanes.length === 0) {
      return <InspectorPanel empty />;
    }

    const layerId = selectedLayerId ?? 'inspector';
    const data = layerData ?? {};

    return (
      <InspectorPanel>
        {sortedPanes.map((pane) => (
          <PanelSection key={pane.id} title={pane.title}>
            <InspectorContentRenderer
              fieldRenderers={fieldRenderers}
              hostContext={hostContext}
              layerData={data}
              layerId={layerId}
              nodes={pane.nodes}
              onCommand={executeCommand}
            />
          </PanelSection>
        ))}
      </InspectorPanel>
    );
  }
);
