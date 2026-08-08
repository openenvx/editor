import { h, type ComponentChild } from 'preact';

import type { HandlerRegistry, WidgetHandler } from './host/handlers';
import { applyPropsPatch } from './host/values-pass';
import {
  compilePropsSchema,
  defaultsFromProps,
  type InferProps,
  type PropsSchema,
} from './props';
import type { WidgetFaceRenderResult, WidgetRegistryEntry } from './protocol';
import { renderToElementTree } from './render-to-element-tree';
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
    /** Batch-patch document values (host `data.values` via bridge). */
    setProps: SetProps<InferProps<S>>;
  }) => ComponentChild;
}

export type WidgetComponent = (props: Record<string, unknown>) => unknown;

export interface RegisteredWidget {
  component: WidgetComponent;
  manifest: WidgetManifest;
  propsSchema: PropsSchema;
}

export type { WidgetRegistryEntry, WidgetFaceRenderResult };

function hostWidgetApi(): {
  register?: (entry: WidgetRegistryEntry) => void;
} | null {
  return (
    (
      globalThis as typeof globalThis & {
        openenvx?: {
          widget?: { register?: (entry: WidgetRegistryEntry) => void };
        };
      }
    ).openenvx?.widget ?? null
  );
}

function publishToHost(
  component: WidgetComponent,
  manifest: WidgetManifest
): void {
  const widget = hostWidgetApi();
  if (!widget?.register) {
    return;
  }
  widget.register({
    id: manifest.id,
    manifest,
    render(values: Record<string, unknown>): WidgetFaceRenderResult {
      const handlers: HandlerRegistry = new Map();
      // Host installs openenvx.widget.applyProps for setProps → setSyncedState.
      const tree = renderToElementTree(h(component as never, values as never), {
        values,
        handlers,
      });
      const bag: Record<string, WidgetHandler> = {};
      for (const [id, handler] of handlers) {
        bag[id] = handler;
      }
      return { tree, handlers: bag };
    },
  });
}

function defineComponent<S extends PropsSchema>(
  options: DefineComponentOptions<S>,
  kinds: WidgetKind[]
): RegisteredWidget {
  if (!options.id || typeof options.id !== 'string') {
    throw new Error(
      '@xmazu/openenvxee-extensions: define*Component requires id'
    );
  }
  const { fields, defaults } = compilePropsSchema(options.props);

  const component: WidgetComponent = (values) => {
    const props = defaultsFromProps(options.props, values) as InferProps<S>;
    const setProps: SetProps<InferProps<S>> = (patch) => {
      applyPropsPatch(patch as Record<string, unknown>);
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
  publishToHost(component, manifest);
  return entry;
}

/**
 * Define a canvas widget. When evaluated in QuickJS, also calls
 * host-injected `openenvx.widget.register`.
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
