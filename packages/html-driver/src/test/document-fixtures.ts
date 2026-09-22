import type { Artboard, Document, DocumentNode } from '@openenvx/studio/schema';
import {
  artboardRulesLayout,
  legacyTestLayer,
  normalizeDocument,
  nodeProps,
  withArtboardRulesLayout,
} from '@openenvx/studio/schema';

/** HTML block node for tests (document `children` + `props`). */
export function testHtmlBlock(
  id: string,
  type: string,
  children?: DocumentNode[],
  props: Record<string, unknown> = {}
): DocumentNode {
  if (children !== undefined) {
    return { id, type, props, children };
  }
  return { id, type, props };
}

export function testHtmlArtboard(
  partial: Partial<Artboard> &
    Pick<Artboard, 'id'> & { nodes?: DocumentNode[] },
  layout = 'html'
): Artboard {
  const { nodes = [], ...rest } = partial;
  return withArtboardRulesLayout(
    {
      name: 'Page',
      space: { width: 800, height: 600 },
      nodes,
      ...rest,
    },
    layout
  );
}

export function testHtmlDocument(artboards: Artboard[]): Document {
  return normalizeDocument({ artboards });
}

export { legacyTestLayer };

export function legacyTestDocument(
  pages: {
    id: string;
    name?: string;
    layout?: string;
    width?: number;
    height?: number;
    layers: DocumentNode[];
  }[]
): Document {
  return testHtmlDocument(
    pages.map((page) =>
      testHtmlArtboard(
        {
          id: page.id,
          name: page.name ?? 'Page',
          space: { width: page.width ?? 800, height: page.height ?? 600 },
          nodes: page.layers,
        },
        page.layout ?? 'html'
      )
    )
  );
}

export { artboardRulesLayout, nodeProps as blockProps };
