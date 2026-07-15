import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getSceneContext } from '../request-context';
import {
  buildLayerSummary,
  findLayerRecord,
  findPageRecord,
} from '../scene/scene-summary';

export function createSceneTools(requestToken: object) {
  const listLayers = createTool({
    id: 'list-layers',
    description:
      'List layers on the current scene as a compact summary (id, type, name, bounds, locked).',
    inputSchema: z.object({
      pageId: z
        .string()
        .optional()
        .describe('Optional page id to filter; defaults to all pages'),
    }),
    execute: async ({ pageId }) => {
      const sceneContext = getSceneContext(requestToken);
      if (!sceneContext) {
        return { layers: [], error: 'No scene context available' };
      }
      let layers = buildLayerSummary(sceneContext);
      if (pageId) {
        const page = findPageRecord(sceneContext, pageId);
        if (!page) {
          return { layers: [], error: `Page not found: ${pageId}` };
        }
        const pageLayers = Array.isArray(page.layers) ? page.layers : [];
        const ids = new Set<string>();
        const collect = (items: unknown[]) => {
          for (const item of items) {
            if (typeof item !== 'object' || item === null) {
              continue;
            }
            const record = item as Record<string, unknown>;
            ids.add(String(record.id));
            const data =
              typeof record.data === 'object' && record.data !== null
                ? (record.data as Record<string, unknown>)
                : {};
            if (Array.isArray(data.children)) {
              collect(data.children);
            }
          }
        };
        collect(pageLayers);
        layers = layers.filter((layer) => ids.has(layer.id));
      }
      return { layers, count: layers.length };
    },
  });

  const getLayer = createTool({
    id: 'get-layer',
    description:
      'Fetch the full layer record (including data properties) by layer id.',
    inputSchema: z.object({
      layerId: z.string().describe('Exact layer id from the scene summary'),
    }),
    execute: async ({ layerId }) => {
      const sceneContext = getSceneContext(requestToken);
      if (!sceneContext) {
        return { error: 'No scene context available' };
      }
      const layer = findLayerRecord(sceneContext, layerId);
      if (!layer) {
        return { error: `Layer not found: ${layerId}` };
      }
      return { layer };
    },
  });

  const getPage = createTool({
    id: 'get-page',
    description: 'Fetch a page record including size and top-level layers.',
    inputSchema: z.object({
      pageId: z
        .string()
        .optional()
        .describe('Page id; defaults to the active page'),
    }),
    execute: async ({ pageId }) => {
      const sceneContext = getSceneContext(requestToken);
      if (!sceneContext) {
        return { error: 'No scene context available' };
      }
      const resolvedId =
        pageId ??
        (typeof sceneContext.activePageId === 'string'
          ? sceneContext.activePageId
          : undefined);
      if (!resolvedId) {
        return { error: 'No pageId provided and no active page' };
      }
      const page = findPageRecord(sceneContext, resolvedId);
      if (!page) {
        return { error: `Page not found: ${resolvedId}` };
      }
      return { page };
    },
  });

  return {
    listLayers,
    getLayer,
    getPage,
  };
}
