import { DndContext } from '@dnd-kit/core';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createHtmlDemoScene } from '../create-html-demo-scene';
import { createBlockRegistry } from '../test/html-editor-harness';
import { BlockTreeRenderer } from './block-tree-renderer';

afterEach(cleanup);

function renderTree(
  overrides: Partial<{
    selectedId: string | null;
    editingTarget: { hostId: string; dataPath: string } | null;
    onSelect: (id: string) => void;
    onStartEdit: (hostId: string, dataPath: string) => void;
    onCommitEdit: (hostId: string, dataPath: string, html: string) => void;
    onDuplicate: (id: string) => void;
    onRemove: (id: string) => void;
  }> = {}
) {
  const scene = createHtmlDemoScene();
  const registry = createBlockRegistry();
  const onSelect = overrides.onSelect ?? vi.fn();
  const onStartEdit = overrides.onStartEdit ?? vi.fn();
  const onCommitEdit = overrides.onCommitEdit ?? vi.fn();
  const onDuplicate = overrides.onDuplicate ?? vi.fn();
  const onRemove = overrides.onRemove ?? vi.fn();

  const result = render(
    <DndContext>
      <BlockTreeRenderer
        editingTarget={overrides.editingTarget ?? null}
        layers={scene.pages[0]!.layers}
        registry={registry}
        scene={scene}
        selectedId={overrides.selectedId ?? null}
        sortDraft={null}
        onCommitEdit={onCommitEdit}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onSelect={onSelect}
        onStartEdit={onStartEdit}
      />
    </DndContext>
  );

  return {
    ...result,
    onCommitEdit,
    onDuplicate,
    onRemove,
    onSelect,
    onStartEdit,
    scene,
  };
}

describe('BlockTreeRenderer', () => {
  it('renders demo content and selects host on hero slot click', () => {
    const { onSelect } = renderTree();
    expect(screen.getByText('Welcome')).toBeTruthy();
    expect(screen.getByText('Flex item')).toBeTruthy();

    fireEvent.click(screen.getByText('Welcome'));
    expect(onSelect).toHaveBeenCalledWith('hero-1');
  });

  it('shows selection menu and wires duplicate/remove', () => {
    const onDuplicate = vi.fn();
    const onRemove = vi.fn();
    renderTree({
      selectedId: 'heading-1',
      onDuplicate,
      onRemove,
    });

    expect(
      screen.getByRole('toolbar', { name: 'Heading actions' })
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDuplicate).toHaveBeenCalledWith('heading-1');
    expect(onRemove).toHaveBeenCalledWith('heading-1');
  });

  it('hides selection menu while editing text', async () => {
    renderTree({
      selectedId: 'heading-1',
      editingTarget: { hostId: 'heading-1', dataPath: 'html' },
    });

    await waitFor(() => {
      expect(document.querySelector('[contenteditable="true"]')).toBeTruthy();
    });
    expect(
      screen.queryByRole('toolbar', { name: 'Heading actions' })
    ).toBeNull();
  });

  it('lets Space reach TipTap while editing (does not preventDefault)', async () => {
    renderTree({
      selectedId: 'heading-1',
      editingTarget: { hostId: 'heading-1', dataPath: 'html' },
    });

    const editable = await waitFor(() => {
      const node = document.querySelector('[contenteditable="true"]');
      expect(node).toBeTruthy();
      return node as HTMLElement;
    });

    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    editable.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('starts slot edit on click of hero headline', () => {
    const onStartEdit = vi.fn();
    const onSelect = vi.fn();
    renderTree({ onSelect, onStartEdit });

    fireEvent.click(screen.getByText('Welcome'));
    expect(onSelect).toHaveBeenCalledWith('hero-1');
    expect(onStartEdit).toHaveBeenCalledWith(
      'hero-1',
      'slots.headline.0.data.html'
    );
  });

  it('starts edit on click of a plain text block', () => {
    const onStartEdit = vi.fn();
    const onSelect = vi.fn();
    renderTree({ onSelect, onStartEdit });

    fireEvent.click(screen.getByText('Below the hero'));
    expect(onSelect).toHaveBeenCalledWith('heading-1');
    expect(onStartEdit).toHaveBeenCalledWith('heading-1', 'html');
  });

  it('keeps heading level chrome while editing', async () => {
    renderTree({
      editingTarget: { hostId: 'heading-1', dataPath: 'html' },
    });

    await waitFor(() => {
      expect(document.querySelector('[contenteditable="true"]')).toBeTruthy();
    });

    const editable = document.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement;
    expect(editable.closest('h2')).toBeTruthy();
  });

  it('keeps slot heading chrome while editing', async () => {
    renderTree({
      editingTarget: {
        hostId: 'hero-1',
        dataPath: 'slots.headline.0.data.html',
      },
    });

    await waitFor(() => {
      expect(document.querySelector('[contenteditable="true"]')).toBeTruthy();
    });

    const editable = document.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement;
    expect(editable.closest('h1')).toBeTruthy();
  });

  it('selects via Enter on a block wrap', () => {
    const onSelect = vi.fn();
    renderTree({ onSelect, selectedId: 'heading-1' });
    const heading = screen.getByText('Below the hero');
    const wrap = heading.closest('[tabindex]') as HTMLElement;
    expect(wrap).toBeTruthy();
    fireEvent.keyDown(wrap, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('heading-1');
  });

  it('shows empty drop zone copy for empty containers', () => {
    const scene = createHtmlDemoScene();
    const emptyFlex = {
      ...scene,
      pages: [
        {
          ...scene.pages[0]!,
          layers: [
            {
              id: 'root',
              type: 'html.root',
              data: {
                background: '#fff',
                children: [
                  {
                    id: 'flex-empty',
                    type: 'html.flex',
                    data: {
                      direction: 'row',
                      wrap: 'true',
                      children: [],
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const registry = createBlockRegistry();
    render(
      <DndContext>
        <BlockTreeRenderer
          editingTarget={null}
          layers={emptyFlex.pages[0]!.layers}
          registry={registry}
          scene={emptyFlex}
          selectedId={null}
          sortDraft={null}
          onCommitEdit={vi.fn()}
          onDuplicate={vi.fn()}
          onRemove={vi.fn()}
          onSelect={vi.fn()}
          onStartEdit={vi.fn()}
        />
      </DndContext>
    );
    expect(
      screen.getByText('Select Blocks in the sidebar to add content')
    ).toBeTruthy();
  });

  it('starts edit via keyboard on editable text', () => {
    const onStartEdit = vi.fn();
    const onSelect = vi.fn();
    renderTree({ onSelect, onStartEdit });
    const hit = screen.getByText('Below the hero').closest('[role="button"]')!;
    fireEvent.keyDown(hit, { key: ' ' });
    expect(onStartEdit).toHaveBeenCalledWith('heading-1', 'html');
  });

  it('outlines the hovered block from hoveredLayerId', () => {
    const scene = createHtmlDemoScene();
    const registry = createBlockRegistry();
    render(
      <DndContext>
        <BlockTreeRenderer
          editingTarget={null}
          hoveredLayerId="heading-1"
          layers={scene.pages[0]!.layers}
          registry={registry}
          scene={scene}
          selectedId={null}
          sortDraft={null}
          onCommitEdit={vi.fn()}
          onDuplicate={vi.fn()}
          onHoverLayer={vi.fn()}
          onRemove={vi.fn()}
          onSelect={vi.fn()}
          onStartEdit={vi.fn()}
        />
      </DndContext>
    );
    const wrap = screen.getByText('Below the hero').closest('[data-layer-id]');
    expect(wrap?.dataset.layerId).toBe('heading-1');
    expect(wrap?.className).toContain('blockWrapHovered');
  });

  it('renders insert-line preview from sortDraft', () => {
    const scene = createHtmlDemoScene();
    const registry = createBlockRegistry();
    render(
      <DndContext>
        <BlockTreeRenderer
          editingTarget={null}
          layers={scene.pages[0]!.layers}
          registry={registry}
          scene={scene}
          selectedId={null}
          sortDraft={{
            activeId: 'heading-1',
            sourceParentId: 'root',
            parentId: 'root',
            orderedIds: ['hero-1', 'heading-1', 'text-1', 'flex-1', 'grid-1'],
            placeholderIndex: 1,
          }}
          onCommitEdit={vi.fn()}
          onDuplicate={vi.fn()}
          onRemove={vi.fn()}
          onSelect={vi.fn()}
          onStartEdit={vi.fn()}
        />
      </DndContext>
    );
    expect(screen.getByText('Welcome')).toBeTruthy();
  });

  it('renders container nest preview highlight', () => {
    const scene = createHtmlDemoScene();
    const registry = createBlockRegistry();
    render(
      <DndContext>
        <BlockTreeRenderer
          editingTarget={null}
          layers={scene.pages[0]!.layers}
          registry={registry}
          scene={scene}
          selectedId={null}
          sortDraft={{
            activeId: 'heading-1',
            sourceParentId: 'root',
            parentId: 'flex-1',
            orderedIds: [],
            placeholderIndex: 0,
            containerPreview: true,
          }}
          onCommitEdit={vi.fn()}
          onDuplicate={vi.fn()}
          onRemove={vi.fn()}
          onSelect={vi.fn()}
          onStartEdit={vi.fn()}
        />
      </DndContext>
    );
    expect(screen.getByText('Flex item')).toBeTruthy();
  });

  it('uses inline chrome when BlockConfig.chromeDisplay is inline', () => {
    const registry = createBlockRegistry();
    registry.register({
      type: 'html.inlineChip',
      label: 'Chip',
      chromeDisplay: 'inline',
      fields: {},
      defaultData: { html: 'chip' },
      render: ({ data }) => <span>{String(data.html ?? '')}</span>,
    });
    const scene = {
      schemaVersion: createHtmlDemoScene().schemaVersion,
      pages: [
        {
          id: 'page-1',
          name: 'Page',
          layout: 'html' as const,
          layers: [
            {
              id: 'root',
              type: 'html.root',
              data: {
                children: [
                  {
                    id: 'chip-1',
                    type: 'html.inlineChip',
                    data: { html: 'chip-a' },
                  },
                  {
                    id: 'chip-2',
                    type: 'html.inlineChip',
                    data: { html: 'chip-b' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    render(
      <DndContext>
        <BlockTreeRenderer
          editingTarget={null}
          layers={scene.pages[0]!.layers}
          registry={registry}
          scene={scene}
          selectedId={null}
          sortDraft={null}
          onCommitEdit={vi.fn()}
          onDuplicate={vi.fn()}
          onRemove={vi.fn()}
          onSelect={vi.fn()}
          onStartEdit={vi.fn()}
        />
      </DndContext>
    );
    const wrap = screen.getByText('chip-a').closest('[data-layer-id]');
    expect(wrap?.className).toContain('blockWrapInline');
  });

  it('uses contents chrome when BlockConfig.chromeDisplay is contents', () => {
    const registry = createBlockRegistry();
    registry.register({
      type: 'html.cell',
      label: 'Cell',
      chromeDisplay: 'contents',
      fields: {},
      defaultData: {},
      render: ({ children }) => <td>{children}</td>,
    });
    registry.register({
      type: 'html.rowLike',
      label: 'Row',
      acceptsChildren: true,
      fields: {},
      defaultData: { children: [] },
      render: ({ children }) => (
        <table>
          <tbody>
            <tr>{children}</tr>
          </tbody>
        </table>
      ),
    });
    const scene = {
      schemaVersion: createHtmlDemoScene().schemaVersion,
      pages: [
        {
          id: 'page-1',
          name: 'Page',
          layout: 'html' as const,
          layers: [
            {
              id: 'root',
              type: 'html.root',
              data: {
                children: [
                  {
                    id: 'row-1',
                    type: 'html.rowLike',
                    data: {
                      children: [
                        {
                          id: 'cell-1',
                          type: 'html.cell',
                          data: { children: [] },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const { container } = render(
      <DndContext>
        <BlockTreeRenderer
          editingTarget={null}
          layers={scene.pages[0]!.layers}
          registry={registry}
          scene={scene}
          selectedId="cell-1"
          sortDraft={null}
          onCommitEdit={vi.fn()}
          onDuplicate={vi.fn()}
          onRemove={vi.fn()}
          onSelect={vi.fn()}
          onStartEdit={vi.fn()}
        />
      </DndContext>
    );
    const cellWrap = container.querySelector('[data-layer-id="cell-1"]');
    expect(cellWrap?.className).toContain('blockWrapContents');
    expect(cellWrap?.className).toContain('blockWrapSelected');
    const cell = cellWrap?.querySelector(':scope > td');
    expect(cell).toBeTruthy();
    // Selection menu is omitted — contents has no box to anchor.
    expect(
      cellWrap?.querySelector('[aria-label="Cell actions"]')
    ).toBeNull();
  });
});
