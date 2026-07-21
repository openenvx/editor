import { Agent } from '@mastra/core/agent';
import type { createOpenRouter } from '@openrouter/ai-sdk-provider';

import type { createMediaTools } from '../../tools/media-tools';

type OpenRouterFactory = ReturnType<typeof createOpenRouter>;
type MediaTools = ReturnType<typeof createMediaTools>;

export function createImageGenSubagent(
  openrouter: OpenRouterFactory,
  modelId: string,
  mediaTools: Pick<MediaTools, 'generateImage'>
): Agent {
  return new Agent({
    id: 'openenvx-image-gen',
    name: 'ImageGen Specialist',
    description:
      'Generates custom images via OpenRouter (OpenAI image models), stores them in R2, and returns durable assetUrl values. Does not mutate the scene.',
    instructions: [
      'You generate custom images when stock photos are not enough.',
      'Always call generate-image with a clear prompt; return the assetUrl to the supervisor.',
      'You are an ADVISOR only. Do NOT call proposal tools.',
      'The supervisor will propose canvas.image layers using the returned assetUrl as assetRef.',
    ].join('\n'),
    // Text model for tool routing; actual pixels come from generate-image / Images API.
    model: openrouter(modelId) as never,
    tools: {
      generateImage: mediaTools.generateImage,
    },
  });
}
