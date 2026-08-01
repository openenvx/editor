import { describe, expect, it } from 'vitest';

import {
  clearRegisteredWidgets,
  defineCanvasComponent,
  Rect,
  renderToElementTree,
  Stack,
  string,
  Text,
  validateWidgetTree,
  WidgetTreeValidationError,
} from './index';

describe('renderToElementTree', () => {
  it('expands function components into element JSON', () => {
    function Card() {
      return (
        <Stack direction="vertical" spacing={8} padding={16}>
          <Text fontSize={20}>Hello</Text>
          <Rect width={100} height={40} fill="#eee" />
        </Stack>
      );
    }

    const tree = renderToElementTree(<Card />);
    expect(tree).toEqual({
      type: 'Stack',
      props: { direction: 'vertical', spacing: 8, padding: 16 },
      children: [
        { type: 'Text', props: { fontSize: 20 }, children: ['Hello'] },
        {
          type: 'Rect',
          props: { width: 100, height: 40, fill: '#eee' },
          children: [],
        },
      ],
    });
  });

  it('serializes onClick to a handler id', () => {
    const handlers = new Map();
    function Clickable() {
      return (
        <Text
          onClick={() => {
            /* noop */
          }}
        >
          Hi
        </Text>
      );
    }
    const tree = renderToElementTree(<Clickable />, { handlers });
    expect(tree?.props.onClick).toBe('h1');
    expect(handlers.has('h1')).toBe(true);
  });
});

describe('defineCanvasComponent', () => {
  it('registers a typed widget and compiles props to fields', () => {
    clearRegisteredWidgets();
    const entry = defineCanvasComponent({
      id: 'wm.demo',
      label: 'Demo',
      props: { title: string({ label: 'Title', default: 'Hello' }) },
      render({ props }) {
        return <Text value={props.title} />;
      },
    });
    expect(entry.manifest.fields.title).toEqual({
      kind: 'text',
      label: 'Title',
    });
    expect(entry.manifest.defaults).toEqual({ title: 'Hello' });
    clearRegisteredWidgets();
  });

  it('rejects unknown canvas elements', () => {
    expect(() =>
      validateWidgetTree(
        { type: 'NotAThing', props: {}, children: [] },
        'canvas'
      )
    ).toThrow(WidgetTreeValidationError);
  });

  it('enforces Row → Column nesting for html', () => {
    expect(() =>
      validateWidgetTree(
        {
          type: 'Row',
          props: {},
          children: [{ type: 'Heading', props: {}, children: ['x'] }],
        },
        'html'
      )
    ).toThrow(/Column/);
  });
});
