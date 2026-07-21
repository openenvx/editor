import type { Agent } from '@mastra/core/agent';
import { Agent as MastraAgent } from '@mastra/core/agent';
import type { Memory } from '@mastra/memory';
import { AGENT_COMMAND_CATALOG } from '@openenvx/agent/schemas';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import type { MediaToolDeps } from '../tools/media-tools';
import { createMediaTools } from '../tools/media-tools';
import { createProposalTools } from '../tools/proposal-tools';
import { createSceneTools } from '../tools/scene-tools';
import { createParallelSpecialistsTool } from '../workflows/parallel-specialists';
import { createDesignSubagent } from './subagents/design-agent';
import { createImageGenSubagent } from './subagents/image-gen-agent';
import { createLayoutSubagent } from './subagents/layout-agent';
import { createMediaSubagent } from './subagents/media-agent';
import { createStyleSubagent } from './subagents/style-agent';

export { formatSceneContext } from '../scene/scene-summary';

const DEFAULT_MODEL = 'x-ai/grok-4.5';
const DEFAULT_MEDIA_MODEL = 'openai/gpt-4.1-mini';
const DEFAULT_IMAGE_MODEL = 'openai/gpt-image-2';

/** Caps extended thinking for interactive editor latency. Override via env. */
const DEFAULT_REASONING_EFFORT = 'low' as const;

const LAYER_TYPE_CATALOG = [
  'canvas.text — rich text; data: { html (required, e.g. "<p>Hello</p>"), fontSize?, fontFamily?, fill?, align?: "left"|"center"|"right", letterSpacing?, lineHeight? }',
  'canvas.rect — rectangle; data: { fill (required), stroke?, strokeWidth?, cornerRadius? }',
  'canvas.image — photo/raster; data: { assetRef (HTTPS URL from Unsplash ingest or generate-image), fit?, alt? }',
  'canvas.svg — vector icon/graphic; data: { svg (required markup), viewBox?, fill?, stroke? }',
  'canvas.group — container; data: { children: Layer[] }',
  'canvas.circle — circle; data: { fill, … }',
].join('\n  - ');

export type ReasoningEffort =
  | 'none'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'max';

export interface CreateAgentOptions {
  apiKey: string;
  modelId?: string;
  /** Text model for Media specialist (default openai/gpt-4.1-mini). */
  mediaModelId?: string;
  /** OpenRouter Images API model (default openai/gpt-image-2). */
  imageModelId?: string;
  requestToken: object;
  memory?: Memory;
  media?: Omit<MediaToolDeps, 'openRouterApiKey' | 'imageModelId'>;
  /** OpenRouter reasoning effort. Prefer over maxTokens when the model supports effort. */
  reasoningEffort?: ReasoningEffort;
  /** Hard token budget for reasoning (Anthropic-style). Takes precedence over effort. */
  reasoningMaxTokens?: number;
}

function buildReasoningExtraBody(
  options: Pick<CreateAgentOptions, 'reasoningEffort' | 'reasoningMaxTokens'>
): { reasoning: { max_tokens: number } | { effort: ReasoningEffort } } {
  if (
    typeof options.reasoningMaxTokens === 'number' &&
    Number.isFinite(options.reasoningMaxTokens) &&
    options.reasoningMaxTokens > 0
  ) {
    return { reasoning: { max_tokens: options.reasoningMaxTokens } };
  }

  return {
    reasoning: { effort: options.reasoningEffort ?? DEFAULT_REASONING_EFFORT },
  };
}

function buildSystemInstructions(): string {
  const commandList = Object.entries(AGENT_COMMAND_CATALOG)
    .map(([name, id]) => `  - ${name}: ${id}`)
    .join('\n');

  return [
    'You are the OpenEnvx design assistant embedded in a canvas editor workbench.',
    'You help users understand and improve their designs.',
    '',
    '## Making changes',
    'Only YOU may call proposal tools (propose-changes, propose-update-property, propose-execute-command, propose-create-layer, propose-delete-layer).',
    'Specialists return advice only — synthesize their advice into concrete proposals.',
    'Never claim you changed the canvas directly — changes are proposed and applied by the client.',
    'Always use exact layer IDs from the scene summary or scene tools.',
    '',
    '## Layer types',
    'ALWAYS use these exact type strings when creating layers (never bare "text" or "rect"):',
    `  - ${LAYER_TYPE_CATALOG}`,
    '',
    '## Media',
    'For stock photos: ask Media (search-unsplash + ingest) or use search-unsplash yourself, then propose canvas.image with the durable assetUrl as assetRef.',
    'For icons / simple vectors: Media search-icons or draft-svg → propose canvas.svg with data.svg.',
    'For custom illustrations: ImageGen generate-image → propose canvas.image with assetUrl.',
    'Prefer Unsplash for real photos; ImageGen when the user needs something unique.',
    '',
    '## Available commands',
    commandList,
    '',
    '## Command constraints',
    '- Align commands (alignLeft, alignCenter, etc.) require at least 2 selected layers.',
    '- distributeHorizontal requires at least 3 selected layers.',
    '- Before running align/distribute commands, include a selectLayers change with the target layer IDs.',
    '- deleteLayer command (scene.deleteLayer) requires selection; prefer propose-delete-layer.',
    '',
    '## Scene tools',
    'Use list-layers, get-layer, and get-page when you need details beyond the compact summary.',
    '',
    '## Delegation',
    'For independent multi-area work, call run-parallel-specialists (design, layout, style, media, imageGen).',
    'For a single specialist task, or when one step depends on another, delegate sequentially.',
    'The design agent owns domain skills (wedding invitations, typography, color harmony).',
    'Media finds stock/icons/SVG; ImageGen generates custom rasters.',
    '',
    'Be concise and practical. Reference layers and pages by name when possible.',
  ].join('\n');
}

export function createOpenEnvxSupervisorAgent(
  options: CreateAgentOptions
): Agent {
  const openrouter = createOpenRouter({
    apiKey: options.apiKey,
    extraBody: buildReasoningExtraBody(options),
  });
  const modelId = options.modelId ?? DEFAULT_MODEL;
  const mediaModelId = options.mediaModelId ?? DEFAULT_MEDIA_MODEL;
  const imageModelId = options.imageModelId ?? DEFAULT_IMAGE_MODEL;
  const proposalTools = createProposalTools(options.requestToken);
  const sceneTools = createSceneTools(options.requestToken);

  const mediaTools = createMediaTools({
    openRouterApiKey: options.apiKey,
    imageModelId,
    publicBaseUrl: options.media?.publicBaseUrl ?? 'http://localhost:8789',
    assets: options.media?.assets,
    unsplashAccessKey: options.media?.unsplashAccessKey,
    fetchImpl: options.media?.fetchImpl,
  });

  const designAgent = createDesignSubagent(openrouter, modelId);
  const layoutAgent = createLayoutSubagent(openrouter, modelId);
  const styleAgent = createStyleSubagent(openrouter, modelId);
  const mediaAgent = createMediaSubagent(openrouter, mediaModelId, mediaTools);
  const imageGenAgent = createImageGenSubagent(
    openrouter,
    mediaModelId,
    mediaTools
  );

  const runParallelSpecialists = createParallelSpecialistsTool({
    designAgent,
    layoutAgent,
    styleAgent,
    mediaAgent,
    imageGenAgent,
    requestToken: options.requestToken,
  });

  return new MastraAgent({
    id: 'openenvx-supervisor',
    name: 'OpenEnvx Supervisor',
    instructions: buildSystemInstructions(),
    model: openrouter(modelId) as never,
    tools: {
      ...proposalTools,
      ...sceneTools,
      ...mediaTools,
      runParallelSpecialists,
    },
    agents: {
      design: designAgent,
      layout: layoutAgent,
      style: styleAgent,
      media: mediaAgent,
      imageGen: imageGenAgent,
    },
    ...(options.memory ? { memory: options.memory } : {}),
  });
}

export { DEFAULT_IMAGE_MODEL, DEFAULT_MEDIA_MODEL, DEFAULT_MODEL };
