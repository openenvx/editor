/** @jsxImportSource preact */
import { describe, expect, it } from 'vitest';

import { defineCanvasComponent, renderToElementTree, string } from './index';
import { Stack, Text } from './canvas';

describe('renderToElementTree', () => {
  it('expands canvas vocabulary to RenderNode JSON', () => {
    const Card = () => (
      <Stack direction="vertical" spacing={8}>
        <Text fontSize={16} value="Hello" />
      </Stack>
    );
    const tree = renderToElementTree(<Card />);
    expect(tree?.type).toBe('Stack');
    expect(tree?.children).toHaveLength(1);
  });

  it('serializes onClick to handler ids when registry provided', () => {
    const handlers = new Map();
    const Clickable = () => <Text onClick={() => {}} value="x" />;
    const tree = renderToElementTree(<Clickable />, { handlers });
    expect(tree?.props.onClick).toBe('h1');
    expect(handlers.size).toBe(1);
  });

  it('routes setProps through values pass without isolate globals', () => {
    const writes: Record<string, unknown>[] = [];
    const entry = defineCanvasComponent({
      id: 'test.counter',
      label: 'Counter',
      props: {
        n: string({ label: 'N', default: '0' }),
      },
      render({ props, setProps }) {
        setProps({ n: String(Number(props.n) + 1) });
        return <Text value={String(props.n)} />;
      },
    });
    const Comp = entry.component as (props: Record<string, unknown>) => unknown;
    const tree = renderToElementTree(<Comp n="2" />, {
      values: { n: '2' },
      onValuesChange: (next) => writes.push(next),
    });
    expect(tree?.type).toBe('Text');
    expect(writes).toEqual([{ n: '3' }]);
  });
});

describe('defineCanvasComponent', () => {
  it('publishes to openenvx.widget.register when present', () => {
    const registered: unknown[] = [];
    const openenvx = {
      widget: {
        register(entry: unknown) {
          registered.push(entry);
        },
      },
    };
    (
      globalThis as typeof globalThis & { openenvx?: typeof openenvx }
    ).openenvx = openenvx;

    const entry = defineCanvasComponent({
      id: 'test.box',
      label: 'Box',
      props: {},
      render() {
        return <Text value="hi" />;
      },
    });
    expect(entry.manifest.id).toBe('test.box');
    expect(registered).toHaveLength(1);
    delete (globalThis as typeof globalThis & { openenvx?: unknown }).openenvx;
  });
});
