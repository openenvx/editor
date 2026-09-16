import { GlobalFonts } from '@napi-rs/canvas';
import type { FontDescriptor } from '@openenvx/studio/core';

import { canvasFontService } from '../../fonts/canvas-font-service';
import {
  buildGoogleFontsCss2Href,
  pickGoogleFontLoadVariants,
} from '../../fonts/google-font-variant';

const loadedFamilies = new Set<string>();
const GOOGLE_FONT_URL_RE = /url\(([^)]+)\)/g;

async function registerFontBytes(
  family: string,
  bytes: ArrayBuffer
): Promise<void> {
  if (loadedFamilies.has(family)) {
    return;
  }
  GlobalFonts.register(bytes, family);
  loadedFamilies.add(family);
}

async function registerFontUrl(family: string, url: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch export font "${family}" from ${url}`);
  }
  await registerFontBytes(family, await response.arrayBuffer());
}

async function registerGoogleFont(descriptor: FontDescriptor): Promise<void> {
  const href = buildGoogleFontsCss2Href(
    descriptor.id,
    pickGoogleFontLoadVariants(['regular', 'italic', '700'])
  );
  const cssResponse = await fetch(href);
  if (!cssResponse.ok) {
    throw new Error(
      `Failed to fetch Google Fonts CSS for "${descriptor.family}"`
    );
  }
  const css = await cssResponse.text();
  const urls = [...css.matchAll(GOOGLE_FONT_URL_RE)]
    .map((match) => match[1]?.replaceAll(/^['"]|['"]$/g, ''))
    .filter((url): url is string => Boolean(url));
  if (urls.length === 0) {
    return;
  }
  await registerFontUrl(descriptor.family, urls[0]!);
}

export async function loadNodeExportFonts(families: string[]): Promise<void> {
  for (const family of families) {
    if (!family || loadedFamilies.has(family)) {
      continue;
    }
    const descriptor = canvasFontService.resolve(family);
    if (!descriptor) {
      continue;
    }
    if (descriptor.src) {
      await registerFontUrl(descriptor.family, descriptor.src);
      continue;
    }
    await registerGoogleFont(descriptor);
  }
}
