import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import {
  ingestBytes,
  ingestFromUrl,
  type AssetBucket,
} from '../assets/ingest-asset';

export interface MediaToolDeps {
  assets?: AssetBucket;
  publicBaseUrl: string;
  unsplashAccessKey?: string;
  openRouterApiKey: string;
  imageModelId: string;
  fetchImpl?: typeof fetch;
}

function requireBucket(deps: MediaToolDeps): AssetBucket {
  if (!deps.assets) {
    throw new Error('ASSETS binding is not configured');
  }
  return deps.assets;
}

/** Strip scripts/handlers from SVG markup for canvas.svg proposals. */
export function sanitizeSvgMarkup(raw: string): string {
  return raw
    .trim()
    .replaceAll(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replaceAll(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replaceAll(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
}

export function createMediaTools(deps: MediaToolDeps) {
  const fetchImpl = deps.fetchImpl ?? fetch;

  const searchUnsplash = createTool({
    id: 'search-unsplash',
    description:
      'Search free Unsplash photos. Returns candidates with download URLs and attribution. Optionally ingest a chosen photo URL into durable storage (set ingestUrl).',
    inputSchema: z.object({
      query: z.string().describe('Search query'),
      perPage: z.number().optional().describe('Results per page (1–10)'),
      ingestUrl: z
        .string()
        .optional()
        .describe(
          'When set, download this photo URL into R2 and return assetUrl'
        ),
    }),
    execute: async ({ query, perPage, ingestUrl }) => {
      if (!deps.unsplashAccessKey) {
        return {
          ok: false,
          error: 'UNSPLASH_ACCESS_KEY is not configured',
        };
      }

      if (ingestUrl) {
        try {
          const ingested = await ingestFromUrl({
            bucket: requireBucket(deps),
            publicBaseUrl: deps.publicBaseUrl,
            url: ingestUrl,
            keyPrefix: 'unsplash',
            fetchImpl,
          });
          return {
            ok: true,
            ingested: true,
            assetUrl: ingested.assetUrl,
            key: ingested.key,
            contentType: ingested.contentType,
          };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }

      const count = Math.min(Math.max(perPage ?? 5, 1), 10);
      const url = new URL('https://api.unsplash.com/search/photos');
      url.searchParams.set('query', query);
      url.searchParams.set('per_page', String(count));

      const response = await fetchImpl(url.toString(), {
        headers: {
          Authorization: `Client-ID ${deps.unsplashAccessKey}`,
          'Accept-Version': 'v1',
        },
      });
      if (!response.ok) {
        return {
          ok: false,
          error: `Unsplash search failed (${response.status})`,
        };
      }

      const json = (await response.json()) as {
        results?: {
          id: string;
          description?: string | null;
          alt_description?: string | null;
          urls?: { raw?: string; full?: string; regular?: string };
          user?: { name?: string; links?: { html?: string } };
          links?: { html?: string };
        }[];
      };

      const results = (json.results ?? []).map((photo) => ({
        id: photo.id,
        description: photo.description ?? photo.alt_description ?? '',
        downloadUrl:
          photo.urls?.regular ?? photo.urls?.full ?? photo.urls?.raw ?? '',
        photographer: photo.user?.name ?? 'Unknown',
        photographerUrl: photo.user?.links?.html ?? '',
        unsplashUrl: photo.links?.html ?? '',
      }));

      return { ok: true, query, results };
    },
  });

  const searchIcons = createTool({
    id: 'search-icons',
    description:
      'Search Iconify icons and return SVG markup for canvas.svg layers. Prefer set prefixes like mdi, lucide, tabler.',
    inputSchema: z.object({
      query: z.string().describe('Icon search query'),
      limit: z.number().optional().describe('Max results (1–20)'),
      prefix: z
        .string()
        .optional()
        .describe('Optional Iconify collection prefix, e.g. lucide'),
      icon: z
        .string()
        .optional()
        .describe(
          'When set (e.g. lucide:heart), fetch that icon SVG directly instead of searching'
        ),
      fill: z
        .string()
        .optional()
        .describe('Optional fill tint for currentColor'),
    }),
    execute: async ({ query, limit, prefix, icon, fill }) => {
      try {
        if (icon) {
          const svgResponse = await fetchImpl(
            `https://api.iconify.design/${encodeURIComponent(icon)}.svg`
          );
          if (!svgResponse.ok) {
            return {
              ok: false,
              error: `Iconify fetch failed (${svgResponse.status})`,
            };
          }
          let svg = sanitizeSvgMarkup(await svgResponse.text());
          if (fill) {
            svg = svg.replaceAll('currentColor', fill);
          }
          return { ok: true, icon, svg, fill };
        }

        const url = new URL('https://api.iconify.design/search');
        url.searchParams.set('query', query);
        url.searchParams.set(
          'limit',
          String(Math.min(Math.max(limit ?? 8, 1), 20))
        );
        if (prefix) {
          url.searchParams.set('prefix', prefix);
        }

        const response = await fetchImpl(url.toString());
        if (!response.ok) {
          return {
            ok: false,
            error: `Iconify search failed (${response.status})`,
          };
        }
        const json = (await response.json()) as { icons?: string[] };
        const icons = json.icons ?? [];

        const withSvg: { icon: string; svg: string }[] = [];
        for (const name of icons.slice(0, 5)) {
          const svgResponse = await fetchImpl(
            `https://api.iconify.design/${encodeURIComponent(name)}.svg`
          );
          if (!svgResponse.ok) {
            continue;
          }
          let svg = sanitizeSvgMarkup(await svgResponse.text());
          if (fill) {
            svg = svg.replaceAll('currentColor', fill);
          }
          withSvg.push({ icon: name, svg });
        }

        return { ok: true, query, icons: withSvg };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const draftSvg = createTool({
    id: 'draft-svg',
    description:
      'Validate and sanitize SVG markup for a canvas.svg layer. Strips scripts and event handlers.',
    inputSchema: z.object({
      svg: z.string().describe('Raw SVG markup'),
      fill: z.string().optional(),
      stroke: z.string().optional(),
      viewBox: z.string().optional(),
    }),
    execute: async ({ svg, fill, stroke, viewBox }) => {
      let cleaned = sanitizeSvgMarkup(svg);
      if (!cleaned) {
        return { ok: false, error: 'svg must not be empty' };
      }
      if (fill) {
        cleaned = cleaned.replaceAll('currentColor', fill);
      }
      if (cleaned.length > 200_000) {
        return { ok: false, error: 'svg too large' };
      }
      return {
        ok: true,
        data: {
          svg: cleaned,
          ...(fill ? { fill } : {}),
          ...(stroke ? { stroke } : {}),
          ...(viewBox ? { viewBox } : {}),
        },
      };
    },
  });

  const ingestAsset = createTool({
    id: 'ingest-asset',
    description:
      'Download a remote image URL into durable R2 storage and return an assetUrl for canvas.image assetRef.',
    inputSchema: z.object({
      url: z.string().describe('HTTP(S) image URL to ingest'),
      keyPrefix: z.string().optional(),
    }),
    execute: async ({ url, keyPrefix }) => {
      try {
        const ingested = await ingestFromUrl({
          bucket: requireBucket(deps),
          publicBaseUrl: deps.publicBaseUrl,
          url,
          keyPrefix: keyPrefix ?? 'ingest',
          fetchImpl,
        });
        return {
          ok: true,
          assetUrl: ingested.assetUrl,
          key: ingested.key,
          contentType: ingested.contentType,
        };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const generateImage = createTool({
    id: 'generate-image',
    description:
      'Generate an image via OpenRouter Images API (OpenAI gpt-image-2 by default), store it in R2, and return assetUrl for canvas.image.',
    inputSchema: z.object({
      prompt: z.string().describe('Image generation prompt'),
      size: z
        .string()
        .optional()
        .describe('Optional size hint, e.g. 1024x1024'),
      quality: z
        .enum(['auto', 'low', 'medium', 'high'])
        .optional()
        .describe('Quality tip for OpenAI image models'),
    }),
    execute: async ({ prompt, size, quality }) => {
      try {
        const body: Record<string, unknown> = {
          model: deps.imageModelId,
          prompt,
        };
        if (size) {
          body.size = size;
        }
        if (quality) {
          body.quality = quality;
        }

        const response = await fetchImpl(
          'https://openrouter.ai/api/v1/images',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${deps.openRouterApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          return {
            ok: false,
            error: `Image generation failed (${response.status}): ${text.slice(0, 300)}`,
          };
        }

        const json = (await response.json()) as {
          data?: { b64_json?: string; url?: string }[];
        };
        const first = json.data?.[0];
        if (!first) {
          return { ok: false, error: 'No image data in OpenRouter response' };
        }

        let bytes: Uint8Array;
        let contentType = 'image/png';
        if (first.b64_json) {
          const binary = atob(first.b64_json);
          bytes = Uint8Array.from(binary, (ch) => ch.codePointAt(0) ?? 0);
        } else if (first.url) {
          const downloaded = await fetchImpl(first.url);
          if (!downloaded.ok) {
            return {
              ok: false,
              error: `Failed to download generated image (${downloaded.status})`,
            };
          }
          contentType =
            downloaded.headers.get('content-type')?.split(';')[0]?.trim() ||
            'image/png';
          bytes = new Uint8Array(await downloaded.arrayBuffer());
        } else {
          return {
            ok: false,
            error: 'Image response missing b64_json and url',
          };
        }

        const ingested = await ingestBytes({
          bucket: requireBucket(deps),
          publicBaseUrl: deps.publicBaseUrl,
          bytes,
          contentType,
          keyPrefix: 'gen',
        });

        return {
          ok: true,
          assetUrl: ingested.assetUrl,
          key: ingested.key,
          contentType,
          model: deps.imageModelId,
        };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  return {
    searchUnsplash,
    searchIcons,
    draftSvg,
    ingestAsset,
    generateImage,
  };
}
