import type { Plugin } from '@openenvx/core';

import {
  DEFAULT_DIALOGS_PLUGIN_ID,
  DefaultDialogsPlugin,
} from '../dialogs/default-dialogs-plugin';
import {
  DEFAULT_FIELDS_PLUGIN_ID,
  DefaultWorkbenchFieldsPlugin,
} from '../fields/default-fields-plugin';
import {
  DEFAULT_VARIABLES_PLUGIN_ID,
  DefaultVariablesContainerPlugin,
} from '../variables/default-variables-plugin';
import {
  DEFAULT_INSPECTOR_PLUGIN_ID,
  DefaultInspectorContainerPlugin,
} from '../views/default-inspector-plugin';
import {
  DEFAULT_WORKBENCH_CHROME_PLUGIN_ID,
  DefaultWorkbenchChromePlugin,
} from '../views/default-workbench-chrome-plugin';

export interface WorkbenchDefaultPluginSpec {
  readonly id: string;
  readonly order: number;
  create(): Plugin;
}

/** Default workbench plugins injected when absent from the host plugin list. */
export const DEFAULT_WORKBENCH_PLUGIN_SPECS: readonly WorkbenchDefaultPluginSpec[] =
  [
    {
      id: DEFAULT_FIELDS_PLUGIN_ID,
      order: 0,
      create: () => new DefaultWorkbenchFieldsPlugin(),
    },
    {
      id: DEFAULT_DIALOGS_PLUGIN_ID,
      order: 10,
      create: () => new DefaultDialogsPlugin(),
    },
    {
      id: DEFAULT_INSPECTOR_PLUGIN_ID,
      order: 20,
      create: () => new DefaultInspectorContainerPlugin(),
    },
    {
      id: DEFAULT_VARIABLES_PLUGIN_ID,
      order: 30,
      create: () => new DefaultVariablesContainerPlugin(),
    },
    {
      id: DEFAULT_WORKBENCH_CHROME_PLUGIN_ID,
      order: 40,
      create: () => new DefaultWorkbenchChromePlugin(),
    },
  ];

const DEFAULT_PLUGIN_IDS = new Set(
  DEFAULT_WORKBENCH_PLUGIN_SPECS.map((spec) => spec.id)
);

/**
 * Merge host plugins with workbench defaults. Defaults activate first (by
 * catalog `order` in {@link DEFAULT_WORKBENCH_PLUGIN_SPECS}); host plugins
 * follow in input order.
 */
export function resolveWorkbenchPlugins(plugins: Plugin[]): Plugin[] {
  const byId = new Map(plugins.map((plugin) => [plugin.id, plugin]));
  const resolvedDefaults = DEFAULT_WORKBENCH_PLUGIN_SPECS.toSorted(
    (a, b) => a.order - b.order
  ).map((spec) => byId.get(spec.id) ?? spec.create());
  const otherPlugins = plugins.filter(
    (plugin) => !DEFAULT_PLUGIN_IDS.has(plugin.id)
  );
  return [...resolvedDefaults, ...otherPlugins];
}
