import {
  wrapVariableTokensForDisplay,
  type TemplateVariable,
} from '@openenvx/core/schema';

export function withDisplayRichTextHtml(
  data: Record<string, unknown>,
  variables: TemplateVariable[],
  missingTip: string
): Record<string, unknown> {
  const rawHtml = String(data.html ?? '');
  if (!rawHtml.includes('{{{')) {
    return data;
  }
  return {
    ...data,
    html: wrapVariableTokensForDisplay(rawHtml, variables, { missingTip }),
  };
}
