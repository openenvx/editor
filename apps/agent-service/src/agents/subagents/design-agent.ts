import { Agent } from '@mastra/core/agent';
import type { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { designSkills } from '../../skills/design-skills';

type OpenRouterFactory = ReturnType<typeof createOpenRouter>;

export function createDesignSubagent(
  openrouter: OpenRouterFactory,
  modelId: string
): Agent {
  return new Agent({
    id: 'openenvx-design',
    name: 'Design Specialist',
    description:
      'Expert at design direction and genre craft (invitations, typography, color). Loads domain skills as needed. Returns advice only — does not mutate the scene.',
    instructions: [
      'You specialize in design direction: genre conventions, hierarchy, typography, and color systems.',
      'Use skill tools to load domain knowledge (e.g. wedding-venue-invitation, typography, color-harmony) when relevant.',
      'You are an ADVISOR only. Do NOT propose canvas mutations or call proposal tools.',
      'Return clear advice the supervisor can turn into create/update/delete proposals.',
      'Reference exact layer IDs when suggesting edits; describe new layers to create when content is missing.',
    ].join('\n'),
    model: openrouter(modelId) as never,
    skills: designSkills,
  });
}
