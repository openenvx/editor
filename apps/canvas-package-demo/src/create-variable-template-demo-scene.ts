import { getDefaultPageDimensions } from '@openenvx/canvas-driver';
import {
  applyNodeTransform,
  createDefaultTransform,
  formatVariableToken,
  normalizeDocument,
  withArtboardRulesLayout,
  type Document,
} from '@openenvx/studio/schema';

const NAME_TOKEN = formatVariableToken('name');
const TITLE_TOKEN = formatVariableToken('title');

export function createVariableTemplateDemoScene(): Document {
  const { width: pageWidth, height: pageHeight } = getDefaultPageDimensions();
  const margin = 48;
  const textWidth = pageWidth - margin * 2;
  const baseTransform = {
    ...createDefaultTransform(),
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
  };

  return normalizeDocument({
    variables: [
      {
        id: 'var-name',
        key: 'name',
        sample: 'Ada Lovelace',
      },
      {
        id: 'var-title',
        key: 'title',
        sample: 'Engineer',
      },
    ],
    artboards: [
      withArtboardRulesLayout(
        {
          id: 'canvas-page',
          name: 'Artboard',
          space: { width: pageWidth, height: pageHeight },
          nodes: [
            applyNodeTransform(
              {
                id: 'demo-name',
                type: 'canvas.text',
                writeMode: 'content',
                props: {
                  html: `<p>${NAME_TOKEN}</p>`,
                  fontSize: 56,
                  fontFamily: 'Inter, sans-serif',
                  fill: '#ffffff',
                  align: 'center',
                },
              },
              {
                ...baseTransform,
                x: margin,
                y: pageHeight * 0.38,
                width: textWidth,
                height: 120,
              }
            ),
            applyNodeTransform(
              {
                id: 'demo-title',
                type: 'canvas.text',
                writeMode: 'content',
                props: {
                  html: `<p>${TITLE_TOKEN}</p>`,
                  fontSize: 28,
                  fontFamily: 'Inter, sans-serif',
                  fill: '#a3a3a3',
                  align: 'center',
                },
              },
              {
                ...baseTransform,
                x: margin,
                y: pageHeight * 0.38 + 132,
                width: textWidth,
                height: 64,
              }
            ),
          ],
        },
        'absolute'
      ),
    ],
  });
}
