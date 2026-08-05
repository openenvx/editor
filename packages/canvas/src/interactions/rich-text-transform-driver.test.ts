import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { describe, expect, it, vi } from 'vitest';

import {
  bakeRichTextTransformEnd,
  runRichTextLiveBake,
  type RichTextCornerSession,
  type RichTextTransformRuntime,
} from './rich-text-transform-driver';

function createRuntime(
  overrides: Partial<RichTextTransformRuntime> & {
    session?: RichTextCornerSession | null;
  } = {}
): RichTextTransformRuntime {
  const origin = {
    ...createDefaultTransform(),
    height: 40,
    width: 200,
    x: 10,
    y: 20,
  };
  const session =
    overrides.session === undefined
      ? ({
          layerId: 'text-1',
          origin,
          startFontSize: 24,
          transform: origin,
          view: { html: '<p>Hi</p>', kind: 'richText' as const },
        } satisfies RichTextCornerSession)
      : overrides.session;

  const node = {
    destroyChildren: vi.fn(),
    getLayer: () => null,
    getParent: () => null,
    getStage: () => null,
    height: () => origin.height,
    rotation: () => origin.rotation,
    scaleX: () => 1,
    scaleY: () => 1,
    width: () => origin.width,
    x: () => origin.x,
    y: () => origin.y,
  } as never;

  const { session: _ignored, ...rest } = overrides;
  return {
    anchor: 'rotater',
    bakeInProgressRef: { current: false },
    cornerBakeRafRef: { current: null },
    dragRef: { current: null },
    layerId: 'text-1',
    node,
    nodeRefs: new Map([['text-1', node]]),
    onUpdateSizeLabel: vi.fn(),
    resizeAnchor: null,
    sessionRef: { current: session },
    transform: origin,
    transformer: null,
    view: { html: '<p>Hi</p>', kind: 'richText' },
    ...rest,
  };
}

describe('rich-text rotater', () => {
  it('runRichTextLiveBake no-ops when resizeAnchor is null', () => {
    const onUpdateSizeLabel = vi.fn();
    const runtime = createRuntime({
      onUpdateSizeLabel,
      resizeAnchor: null,
    });

    runRichTextLiveBake(runtime);

    expect(onUpdateSizeLabel).not.toHaveBeenCalled();
    expect(runtime.sessionRef.current?.transform.width).toBe(200);
    expect(runtime.sessionRef.current?.startFontSize).toBe(24);
  });

  it('bakeRichTextTransformEnd clears imperative children when resizeAnchor is null', () => {
    const runtime = createRuntime({ resizeAnchor: null });
    const result = bakeRichTextTransformEnd(runtime, runtime.node);
    expect(result).toBeNull();
    expect(runtime.node.destroyChildren).toHaveBeenCalled();
  });
});
