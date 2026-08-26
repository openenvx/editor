import { Plugin } from '@openenvx/core';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DIALOGS_PLUGIN_ID,
  DefaultDialogsPlugin,
} from '../dialogs/default-dialogs-plugin';
import {
  DEFAULT_FIELDS_PLUGIN_ID,
  DefaultWorkbenchFieldsPlugin,
} from '../fields/default-fields-plugin';
import {
  DEFAULT_WORKBENCH_PLUGIN_SPECS,
  resolveWorkbenchPlugins,
} from './resolve-workbench-plugins';
import {
  DEFAULT_WORKBENCH_CHROME_PLUGIN_ID,
  DefaultWorkbenchChromePlugin,
} from '../views/default-workbench-chrome-plugin';

class HostPlugin extends Plugin {
  readonly id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }

  activate(): void {}
}

describe('resolveWorkbenchPlugins', () => {
  it('injects all defaults when host passes none', () => {
    const resolved = resolveWorkbenchPlugins([]);

    expect(resolved.map((plugin) => plugin.id)).toEqual(
      DEFAULT_WORKBENCH_PLUGIN_SPECS.toSorted((a, b) => a.order - b.order).map(
        (spec) => spec.id
      )
    );
  });

  it('sorts defaults by catalog order regardless of host input order', () => {
    const resolved = resolveWorkbenchPlugins([
      new DefaultWorkbenchChromePlugin(),
      new DefaultWorkbenchFieldsPlugin(),
      new DefaultDialogsPlugin(),
    ]);

    expect(resolved.map((plugin) => plugin.id)).toEqual([
      DEFAULT_FIELDS_PLUGIN_ID,
      DEFAULT_DIALOGS_PLUGIN_ID,
      ...DEFAULT_WORKBENCH_PLUGIN_SPECS.toSorted((a, b) => a.order - b.order)
        .map((spec) => spec.id)
        .filter(
          (id) =>
            id !== DEFAULT_FIELDS_PLUGIN_ID && id !== DEFAULT_DIALOGS_PLUGIN_ID
        ),
    ]);
  });

  it('keeps host-provided default instances instead of creating new ones', () => {
    const hostFields = new DefaultWorkbenchFieldsPlugin();
    const resolved = resolveWorkbenchPlugins([hostFields]);

    expect(resolved[0]).toBe(hostFields);
  });

  it('appends non-default host plugins after defaults in input order', () => {
    const canvas = new HostPlugin('canvas.plugin');
    const html = new HostPlugin('html.plugin');
    const resolved = resolveWorkbenchPlugins([canvas, html]);

    expect(resolved.at(-2)).toBe(canvas);
    expect(resolved.at(-1)).toBe(html);
    expect(resolved).toHaveLength(
      DEFAULT_WORKBENCH_PLUGIN_SPECS.length + 2
    );
  });

  it('does not duplicate defaults when host also lists them', () => {
    const hostChrome = new DefaultWorkbenchChromePlugin();
    const canvas = new HostPlugin('canvas.plugin');
    const resolved = resolveWorkbenchPlugins([canvas, hostChrome]);

    expect(
      resolved.filter((plugin) => plugin.id === DEFAULT_WORKBENCH_CHROME_PLUGIN_ID)
    ).toHaveLength(1);
    expect(
      resolved.find((plugin) => plugin.id === DEFAULT_WORKBENCH_CHROME_PLUGIN_ID)
    ).toBe(hostChrome);
    expect(resolved.at(-1)).toBe(canvas);
  });
});
