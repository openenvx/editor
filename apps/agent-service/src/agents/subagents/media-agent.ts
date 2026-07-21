import { Agent } from '@mastra/core/agent';
import type { createOpenRouter } from '@openrouter/ai-sdk-provider';

import type { createMediaTools } from '../../tools/media-tools';

type OpenRouterFactory = ReturnType<typeof createOpenRouter>;
type MediaTools = ReturnType<typeof createMediaTools>;

export function createMediaSubagent(
  openrouter: OpenRouterFactory,
  modelId: string,
  mediaTools: Pick<
    MediaTools,
    'searchUnsplash' | 'searchIcons' | 'draftSvg' | 'ingestAsset'
  >
): Agent {
  return new Agent({
    id: 'openenvx-media',
    name: 'Media Specialist',
    description:
      'Finds stock photos (Unsplash), icons (Iconify), and drafts SVG markup. Returns asset URLs / SVG for the supervisor to propose as layers. Does not mutate the scene.',
    instructions: [
      'You specialize in media assets for the canvas: free stock photos, icons, and simple SVG graphics.',
      'Use search-unsplash for photos, then ingest via ingestUrl or ingest-asset so the supervisor gets a durable assetUrl for canvas.image.',
      'Use search-icons for Iconify SVG; return svg markup for canvas.svg (not canvas.image).',
      'Use draft-svg to sanitize custom SVG before the supervisor proposes canvas.svg.',
      'You are an ADVISOR only. Do NOT call proposal tools or claim the canvas was changed.',
      'Prefer stock photos when a real photo fits; suggest ImageGen when the user needs a custom illustration.',
    ].join('\n'),
    model: openrouter(modelId) as never,
    tools: {
      searchUnsplash: mediaTools.searchUnsplash,
      searchIcons: mediaTools.searchIcons,
      draftSvg: mediaTools.draftSvg,
      ingestAsset: mediaTools.ingestAsset,
    },
  });
}
