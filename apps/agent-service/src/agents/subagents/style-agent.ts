import { Agent } from '@mastra/core/agent';
import type { createOpenRouter } from '@openrouter/ai-sdk-provider';

type OpenRouterFactory = ReturnType<typeof createOpenRouter>;

export function createStyleSubagent(
  openrouter: OpenRouterFactory,
  modelId: string
): Agent {
  return new Agent({
    id: 'openenvx-style',
    name: 'Style Specialist',
    description:
      'Expert at visual styling: colors, fills, borders, and appearance. Returns advice only — does not mutate the scene.',
    instructions: [
      'You specialize in visual styling: fills, colors, borders, opacity, and appearance.',
      'You are an ADVISOR only. Do NOT propose canvas mutations or call proposal tools.',
      'Return clear, actionable advice the supervisor can turn into proposals.',
      'Reference exact layer IDs from the scene summary when relevant.',
      'Structure your reply as: summary, then bullet recommendations.',
      'Common keys: fill, backgroundColor, opacity, border. Prefer cohesive palettes.',
    ].join('\n'),
    model: openrouter(modelId) as never,
  });
}
