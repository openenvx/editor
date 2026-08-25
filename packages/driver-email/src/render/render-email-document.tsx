import { getLayerChildren } from '@openenvx/core';
import type { Page } from '@openenvx/core/schema';
import { renderBlockTree, type BlockRegistry } from '@openenvx/html/runtime';
import { Body, Font, Head, Html, Preview } from '@react-email/components';
import { render } from '@react-email/render';

import {
  EMAIL_FALLBACK_FONT_FAMILY,
  EMAIL_FONT_FAMILY,
  EMAIL_FONT_WEIGHTS,
  EMAIL_WEB_FONT,
  emailFontStack,
} from './email-document-font';

function layerData(layer: { data?: unknown }): Record<string, unknown> {
  return typeof layer.data === 'object' && layer.data !== null
    ? (layer.data as Record<string, unknown>)
    : {};
}

export interface RenderEmailDocumentOptions {
  /** Indent markup for HTML source view; export defaults to compact. */
  pretty?: boolean;
}

/**
 * Walk a page's email block tree and produce email-safe HTML via React-Email.
 * Uses the same `BlockConfig.render` functions as the live editor pane
 * (including `email.root`).
 */
export async function renderEmailDocument(
  page: Page,
  registry: BlockRegistry,
  options?: RenderEmailDocumentOptions
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

  return render(document, { pretty: options?.pretty ?? false });
}
