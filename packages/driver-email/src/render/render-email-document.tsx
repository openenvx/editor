import { getLayerChildren, isLayerVisible } from '@openenvx/core';
import type { BlockConfig, BlockRegistry } from '@openenvx/html';
import { Body, Font, Head, Html, Preview } from '@react-email/components';
import { render } from '@react-email/render';
import type { Layer, Page } from '@xmazu/openenvxee-schema';
import {
  createElement,
  Fragment,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  EMAIL_FALLBACK_FONT_FAMILY,
  EMAIL_FONT_FAMILY,
  EMAIL_FONT_WEIGHTS,
  EMAIL_WEB_FONT,
  emailFontStack,
} from './email-document-font';

function layerData(layer: Layer): Record<string, unknown> {
  return typeof layer.data === 'object' && layer.data !== null
    ? (layer.data as Record<string, unknown>)
    : {};
}

function renderBlockTree(
  layers: readonly Layer[],
  registry: BlockRegistry
): ReactNode[] {
  return layers.flatMap((layer) => {
    if (!isLayerVisible(layer)) {
      return [];
    }
    const config = registry.get(layer.type);
    if (!config) {
      return [];
    }
    return [renderBlock(layer, config, registry)];
  });
}

function renderBlock(
  layer: Layer,
  config: BlockConfig,
  registry: BlockRegistry
): ReactElement {
  const data = layerData(layer);
  const children = config.acceptsChildren
    ? renderBlockTree(getLayerChildren(layer), registry)
    : undefined;
  const slots = config.slots ? renderSlots(data, config, registry) : undefined;
  return createElement(
    Fragment,
    { key: layer.id },
    config.render({ data, children, slots })
  );
}

function renderSlots(
  data: Record<string, unknown>,
  config: BlockConfig,
  registry: BlockRegistry
): Record<string, ReactNode> {
  const rawSlots = data.slots;
  const result: Record<string, ReactNode> = {};
  if (!config.slots || !rawSlots || typeof rawSlots !== 'object') {
    return result;
  }
  for (const slotKey of Object.keys(config.slots)) {
    const parts = (rawSlots as Record<string, unknown>)[slotKey];
    if (!Array.isArray(parts)) {
      continue;
    }
    result[slotKey] = parts.flatMap((part) => {
      if (!part || typeof part !== 'object') {
        return [];
      }
      const layer = part as Layer;
      if (!isLayerVisible(layer)) {
        return [];
      }
      const partConfig = registry.get(layer.type);
      if (!partConfig) {
        return [];
      }
      return [renderBlock(layer, partConfig, registry)];
    });
  }
  return result;
}

/**
 * Walk a page's email block tree and produce email-safe HTML via React-Email.
 * Uses the same `BlockConfig.render` functions as the live editor pane
 * (including `email.root`).
 */
export async function renderEmailDocument(
  page: Page,
  registry: BlockRegistry
): Promise<string> {
  const root = page.layers.find((layer) => layer.type === 'email.root');
  if (!root) {
    throw new Error('Page has no email.root block');
  }
  const rootConfig = registry.get('email.root');
  if (!rootConfig) {
    throw new Error('email.root is not registered');
  }
  const data = layerData(root);
  const preheader = String(data.preheader ?? '');
  const children = renderBlockTree(getLayerChildren(root), registry);
  const fontStack = emailFontStack();

  const document = (
    <Html>
      <Head>
        {EMAIL_FONT_WEIGHTS.map((weight) => (
          <Font
            fallbackFontFamily={[...EMAIL_FALLBACK_FONT_FAMILY]}
            fontFamily={EMAIL_FONT_FAMILY}
            fontStyle="normal"
            fontWeight={weight}
            key={weight}
            webFont={EMAIL_WEB_FONT}
          />
        ))}
      </Head>
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: fontStack,
          fontSize: 16,
        }}
      >
        {rootConfig.render({ data, children })}
      </Body>
    </Html>
  );

  return render(document);
}
