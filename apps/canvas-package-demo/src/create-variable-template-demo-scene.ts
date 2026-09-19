import { getDefaultPageDimensions } from '@openenvx/canvas-driver';
import {
  createDefaultTransform,
  formatVariableToken,
  normalizeScene,
  type Scene,
} from '@openenvx/studio/schema';

const NAME_TOKEN = formatVariableToken('name');
const TITLE_TOKEN = formatVariableToken('title');

export function createVariableTemplateDemoScene(): Scene {
  const { width: pageWidth, height: pageHeight } = getDefaultPageDimensions();
  const margin = 48;
  const textWidth = pageWidth - margin * 2;

  return normalizeScene({
    variables: [
      {
        id: 'var-name',
        key: 'name',
        label: 'Name',
        sample: 'Ada Lovelace',
      },
      {
        id: 'var-title',
        key: 'title',
        label: 'Title',
        sample: 'Engineer',
      },
    ],
    pages: [
      {
        id: 'canvas-page',
        name: 'Artboard',
        layout: 'absolute',
        width: pageWidth,
        height: pageHeight,
        layers: [
          {
            id: 'demo-name',
            type: 'canvas.text',
            editable: true,
            data: {
              html: `<p>${NAME_TOKEN}</p>`,
              fontSize: 56,
              fontFamily: 'Inter, sans-serif',
              fill: '#ffffff',
              align: 'center',
            },
            transform: {
              ...createDefaultTransform(),
              x: margin,
              y: pageHeight * 0.38,
              width: textWidth,
              height: 120,
            },
          },
          {
            id: 'demo-title',
            type: 'canvas.text',
            editable: true,
            data: {
              html: `<p>${TITLE_TOKEN}</p>`,
              fontSize: 28,
              fontFamily: 'Inter, sans-serif',
              fill: '#a3a3a3',
              align: 'center',
            },
            transform: {
              ...createDefaultTransform(),
              x: margin,
              y: pageHeight * 0.38 + 132,
              width: textWidth,
              height: 64,
            },
          },
        ],
      },
    ],
  });
}
