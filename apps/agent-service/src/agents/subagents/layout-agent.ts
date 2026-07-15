import { Agent } from '@mastra/core/agent';
import type { createOpenRouter } from '@openrouter/ai-sdk-provider';

type OpenRouterFactory = ReturnType<typeof createOpenRouter>;

export function createLayoutSubagent(
  openrouter: OpenRouterFactory,
  modelId: string
): Agent {
  return new Agent({
    id: 'openenvx-layout',
    name: 'Layout Specialist',
    description:
      'Expert at arranging, aligning, and distributing layers on the canvas. Delegate layout tasks like alignment, spacing, and positioning. Returns advice only — does not mutate the scene.',
    instructions: [
      'You specialize in canvas layout: alignment, distribution, spacing, and positioning.',
      'You are an ADVISOR only. Do NOT propose canvas mutations or call proposal tools.',
      'Return clear, actionable advice the supervisor can turn into proposals.',
      'Reference exact layer IDs from the scene summary when relevant.',
      'Structure your reply as: summary, then bullet recommendations.',
      'Align needs ≥2 layers; distribute needs ≥3. Mention selectLayers then align/distribute commands.',
    ].join('\n'),
    model: openrouter(modelId) as never,
  });
}
