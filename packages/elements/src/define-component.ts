import { h, type ComponentChild } from 'preact';

import {
  compilePropsSchema,
  defaultsFromProps,
  type InferProps,
  type PropsSchema,
} from './props';
import { renderToElementTree } from './render-to-layers';
import type { WidgetKind, WidgetManifest } from './types';

export type SetProps<P extends Record<string, unknown>> = (
  patch: Partial<P>
) => void;

export interface DefineComponentOptions<S extends PropsSchema> {
  id: string;
  label: string;
  icon?: string;
  props: S;
  render: (ctx: {
    props: InferProps<S>;
    setProps: SetProps<InferProps<S>>;
  }) => ComponentChild;
}

export type WidgetComponent = (props: Record<string, unknown>) => unknown;

export interface RegisteredWidget {
  component: WidgetComponent;
  manifest: WidgetManifest;
  propsSchema: PropsSchema;
}

const registry = new Map<string, RegisteredWidget>();

interface GlobalWidgetEntry {
  render: (values: Record<string, unknown>) => unknown;
  manifest: WidgetManifest;
}

interface IsolateBridge {
  setSyncedState?: (value: unknown) => unknown;
}

function writeValuesToHost(values: Record<string, unknown>): void {
  const bridge = (
    globalThis as typeof globalThis & { openenvx?: IsolateBridge }
  ).openenvx;
  bridge?.setSyncedState?.(values);
}

function publishToGlobal(
  component: WidgetComponent,
  manifest: WidgetManifest
): void {
  const globalObject = globalThis as typeof globalThis & {
    __openenvxWidgetRegistry?: Record<string, GlobalWidgetEntry>;
    __openenvxOnWidgetRegistered?: (manifest: WidgetManifest) => void;
  };
  const bag = globalObject.__openenvxWidgetRegistry ?? {};
  bag[manifest.id] = {
    manifest,
    render(values: Record<string, unknown>) {
      return renderToElementTree(h(component as never, values as never), {
        values,
        onValuesChange: writeValuesToHost,
      });
    },
  };
  globalObject.__openenvxWidgetRegistry = bag;
  globalObject.__openenvxOnWidgetRegistered?.(manifest);
}

function defineComponent<S extends PropsSchema>(
  options: DefineComponentOptions<S>,
  kinds: WidgetKind[]
): RegisteredWidget {
  if (!options.id || typeof options.id !== 'string') {
    throw new Error('@xmazu/openenvxee-elements: define*Component requires id');
  }
  const { fields, defaults } = compilePropsSchema(options.props);

  const component: WidgetComponent = (values) => {
    const props = defaultsFromProps(options.props, values) as InferProps<S>;
    const setProps: SetProps<InferProps<S>> = (patch) => {
      const store = (
        globalThis as typeof globalThis & {
          __openenvxSetProps?: (patch: Record<string, unknown>) => void;
        }
      ).__openenvxSetProps;
      store?.(patch as Record<string, unknown>);
    };
    return options.render({ props, setProps });
  };

  const manifest: WidgetManifest = {
    id: options.id,
    label: options.label,
    ...(options.icon ? { icon: options.icon } : {}),
    kinds,
    fields,
    defaults,
  };

  const entry: RegisteredWidget = {
    component,
    manifest,
    propsSchema: options.props,
  };
  registry.set(options.id, entry);
  publishToGlobal(component, manifest);
  return entry;
}

/**
 * Define a canvas widget. Returns the registered entry; also publishes to the
 * isolate global registry when evaluated in QuickJS.
 */
export function defineCanvasComponent<S extends PropsSchema>(
  options: DefineComponentOptions<S>
): RegisteredWidget {
  return defineComponent(options, ['canvas']);
}

/** Define an HTML widget (same runtime, html vocabulary). */
export function defineHtmlComponent<S extends PropsSchema>(
  options: DefineComponentOptions<S>
): RegisteredWidget {
  return defineComponent(options, ['html']);
}

export function getRegisteredWidget(id: string): RegisteredWidget | undefined {
  return registry.get(id);
}

export function getRegisteredWidgets(): RegisteredWidget[] {
  return [...registry.values()];
}

export function clearRegisteredWidgets(): void {
  registry.clear();
  const globalObject = globalThis as typeof globalThis & {
    __openenvxWidgetRegistry?: Record<string, GlobalWidgetEntry>;
  };
  globalObject.__openenvxWidgetRegistry = {};
}
