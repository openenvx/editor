import type { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { emitAgentTask } from '../request-context';

const specialistIdSchema = z.enum(['design', 'layout', 'style']);

const specialistAdviceSchema = z.object({
  agentId: z.string(),
  summary: z.string(),
  advice: z.string(),
});

function buildPrompt(
  role: string,
  brief: string,
  sceneSummary: string,
  override?: string
): string {
  return [
    override?.trim() || brief,
    '',
    `You are the ${role} specialist. Advise only; do not mutate the scene.`,
    '',
    'Scene context:',
    sceneSummary,
  ].join('\n');
}

async function runSpecialist(options: {
  agent: Agent;
  agentId: string;
  label: string;
  prompt: string;
  requestToken: object;
}): Promise<z.infer<typeof specialistAdviceSchema>> {
  const { agent, agentId, label, prompt, requestToken } = options;
  const taskId = `${agentId}-${Date.now()}`;

  emitAgentTask(requestToken, {
    taskId,
    agentId,
    label,
    status: 'running',
  });

  try {
    const result = await agent.generate(prompt);
    const advice = result.text ?? '';
    const summary =
      advice
        .split('\n')
        .find((line) => line.trim().length > 0)
        ?.slice(0, 120) ?? `${label} complete`;

    emitAgentTask(requestToken, {
      taskId,
      agentId,
      label,
      status: 'complete',
      summary,
    });

    return { agentId, summary, advice };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emitAgentTask(requestToken, {
      taskId,
      agentId,
      label,
      status: 'error',
      summary: message,
    });
    return {
      agentId,
      summary: `Error: ${message}`,
      advice: '',
    };
  }
}

const emptyAdvice = (
  agentId: string,
  reason: string
): z.infer<typeof specialistAdviceSchema> => ({
  agentId,
  summary: reason,
  advice: '',
});

/**
 * Parallel fan-out as a plain Mastra tool (ZodObject input).
 * Avoids registering a Mastra workflow on the agent — workflows convert to
 * JSON Schema + AJV, which uses `new Function()` and breaks on Cloudflare Workers.
 */
export function createParallelSpecialistsTool(options: {
  designAgent: Agent;
  layoutAgent: Agent;
  styleAgent: Agent;
  requestToken: object;
}) {
  const { designAgent, layoutAgent, styleAgent, requestToken } = options;

  return createTool({
    id: 'run-parallel-specialists',
    description:
      'Run selected design, layout, and/or style specialists in parallel when their tasks are independent. Pass `agents` to choose which specialists run; omit to run all three. Returns merged advice for you to synthesize into proposals.',
    inputSchema: z.object({
      brief: z.string().describe('Overall task brief for all specialists'),
      sceneSummary: z.string().describe('Compact scene summary text'),
      agents: z
        .array(specialistIdSchema)
        .min(1)
        .optional()
        .describe(
          'Which specialists to run. Defaults to design, layout, and style.'
        ),
      designPrompt: z
        .string()
        .optional()
        .describe('Optional override prompt for the design specialist'),
      layoutPrompt: z
        .string()
        .optional()
        .describe('Optional override prompt for the layout specialist'),
      stylePrompt: z
        .string()
        .optional()
        .describe('Optional override prompt for the style specialist'),
    }),
    execute: async (inputData) => {
      const selected = new Set(
        inputData.agents ?? (['design', 'layout', 'style'] as const)
      );

      const [design, layout, style] = await Promise.all([
        selected.has('design')
          ? runSpecialist({
              agent: designAgent,
              agentId: 'design',
              label: 'Design',
              prompt: buildPrompt(
                'design',
                inputData.brief,
                inputData.sceneSummary,
                inputData.designPrompt
              ),
              requestToken,
            })
          : emptyAdvice('design', 'Skipped'),
        selected.has('layout')
          ? runSpecialist({
              agent: layoutAgent,
              agentId: 'layout',
              label: 'Layout',
              prompt: buildPrompt(
                'layout',
                inputData.brief,
                inputData.sceneSummary,
                inputData.layoutPrompt
              ),
              requestToken,
            })
          : emptyAdvice('layout', 'Skipped'),
        selected.has('style')
          ? runSpecialist({
              agent: styleAgent,
              agentId: 'style',
              label: 'Style',
              prompt: buildPrompt(
                'style',
                inputData.brief,
                inputData.sceneSummary,
                inputData.stylePrompt
              ),
              requestToken,
            })
          : emptyAdvice('style', 'Skipped'),
      ]);

      const sections: string[] = [];
      if (selected.has('design')) {
        sections.push('## Design', design.advice || design.summary, '');
      }
      if (selected.has('layout')) {
        sections.push('## Layout', layout.advice || layout.summary, '');
      }
      if (selected.has('style')) {
        sections.push('## Style', style.advice || style.summary, '');
      }

      return {
        design,
        layout,
        style,
        combined: sections.join('\n').trim(),
      };
    },
  });
}

/** Kept for unit tests that assert the merged advice shape. */
export const parallelSpecialistsOutputSchema = z.object({
  design: specialistAdviceSchema,
  layout: specialistAdviceSchema,
  style: specialistAdviceSchema,
  combined: z.string(),
});
