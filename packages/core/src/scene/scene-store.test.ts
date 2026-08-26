import { describe, expect, it } from "vitest";

import { moveLayerToIndex, reorderLayers, SceneStore } from "./scene-store";

describe(SceneStore, () => {
  it("does not push history when normalize rejects the transaction", () => {
    const store = new SceneStore(
      {
        schemaVersion: 2,
        pages: [
          {
            id: "p1",
            name: "Page",
            layout: "absolute",
            width: 100,
            height: 100,
            layers: [
              {
                id: "t1",
                type: "canvas.text",
                data: { html: "<p>Hi</p>", align: "left" },
                transform: {
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 40,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 1,
                },
              },
            ],
          },
        ],
      },
      { activePageId: "p1", primaryLayerId: null, selectedLayerIds: [] }
    );

    expect(() =>
      store.apply({
        apply: (scene) => ({
          ...scene,
          pages: scene.pages.map((page) => ({
            ...page,
            layers: page.layers.map((layer) =>
              layer.id === "t1"
                ? {
                    ...layer,
                    data: { ...(layer.data as object), align: "justify" },
                  }
                : layer
            ),
          })),
        }),
        label: "Bad align",
      })
    ).toThrow(/normalize/i);

    expect(store.canUndo()).toBe(false);
    expect(
      (store.getScene().pages[0]!.layers[0]!.data as { align?: string }).align
    ).toBe("left");
  });

  it("applies transactions with undo", () => {
    const store = new SceneStore();
    const pageId = store.getScene().pages[0]!.id;

    store.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                layers: [
                  ...p.layers,
                  { id: "l1", type: "text", data: { text: "Hi" } },
                ],
              }
            : p
        ),
      }),
      label: "Add layer",
    });

    expect(store.getScene().pages[0]!.layers).toHaveLength(1);
    expect(store.undo()).toBeTruthy();
    expect(store.getScene().pages[0]!.layers).toHaveLength(0);
  });

  it("replaceScene pushes history so undo restores the prior scene", () => {
    const store = new SceneStore();
    const pageId = store.getScene().pages[0]!.id;
    store.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                layers: [{ id: "keep", type: "text", data: { text: "A" } }],
              }
            : p
        ),
      }),
      label: "Seed",
    });

    store.replaceScene({
      schemaVersion: 2,
      pages: [
        {
          id: "email-page",
          name: "Template",
          layout: "email",
          layers: [{ id: "root", type: "email.root", data: { children: [] } }],
        },
      ],
    });

    expect(store.getScene().pages[0]!.name).toBe("Template");
    expect(store.canUndo()).toBe(true);
    expect(store.undo()).toBeTruthy();
    expect(store.getScene().pages[0]!.layers.map((l) => l.id)).toStrictEqual([
      "keep",
    ]);
  });

  it("setScene replaces without an extra history entry", () => {
    const store = new SceneStore();
    const beforeName = store.getScene().pages[0]!.name;
    store.setScene({
      schemaVersion: 2,
      pages: [
        {
          id: "p2",
          name: "Replaced",
          layout: "flow",
          layers: [],
        },
      ],
    });
    expect(store.getScene().pages[0]!.name).toBe("Replaced");
    expect(store.canUndo()).toBe(false);
    expect(beforeName).not.toBe("Replaced");
  });

  it("commits scene.variables-only transactions", () => {
    const store = new SceneStore();
    expect(store.getScene().variables).toBeUndefined();

    store.apply({
      apply: (scene) => ({
        ...scene,
        variables: [{ id: "var-1", key: "name" }],
      }),
      label: "Add variable",
    });

    expect(store.getScene().variables).toStrictEqual([
      { id: "var-1", key: "name" },
    ]);
    expect(store.canUndo()).toBe(true);
    expect(store.undo()).toBe(true);
    expect(store.getScene().variables).toBeUndefined();
  });

  it("supports multi-select", () => {
    const store = new SceneStore();
    const pageId = store.getScene().pages[0]!.id;
    store.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                layers: [
                  { id: "a", type: "text", data: {} },
                  { id: "b", type: "text", data: {} },
                ],
              }
            : p
        ),
      }),
      label: "Add layers",
    });
    store.selectLayers(["a", "b"], "a");
    expect(store.getSelection().selectedLayerIds).toStrictEqual(["a", "b"]);
    expect(store.getSelection().primaryLayerId).toBe("a");
  });

  it("keeps scene identity on selection-only changes", () => {
    const store = new SceneStore();
    const before = store.getScene();
    let notifiedScene: unknown;
    store.onDidChangeScene((snapshot) => {
      notifiedScene = snapshot.scene;
    });
    store.selectLayers([], null);
    expect(store.getScene()).toBe(before);
    expect(notifiedScene).toBe(before);
  });

  it("shares page identity for untouched pages after apply", () => {
    const store = new SceneStore({
      schemaVersion: 4,
      pages: [
        {
          id: "p1",
          name: "One",
          layout: "absolute",
          width: 100,
          height: 100,
          layers: [
            {
              id: "a",
              type: "canvas.rect",
              data: { fill: "#000" },
              transform: {
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                rotation: 0,
                opacity: 1,
              },
            },
          ],
        },
        {
          id: "p2",
          name: "Two",
          layout: "absolute",
          width: 100,
          height: 100,
          layers: [],
        },
      ],
    });
    const page2Before = store.getScene().pages[1];
    store.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((page) =>
          page.id === "p1"
            ? {
                ...page,
                layers: page.layers.map((layer) =>
                  layer.id === "a"
                    ? {
                        ...layer,
                        transform: {
                          ...layer.transform!,
                          x: 5,
                        },
                      }
                    : layer
                ),
              }
            : page
        ),
      }),
      label: "Move a",
    });
    expect(store.getScene().pages[1]).toBe(page2Before);
  });

  it("commits page reorder when page refs are unchanged", () => {
    const store = new SceneStore({
      schemaVersion: 4,
      pages: [
        {
          id: "p1",
          name: "One",
          layout: "absolute",
          width: 100,
          height: 100,
          layers: [],
        },
        {
          id: "p2",
          name: "Two",
          layout: "absolute",
          width: 100,
          height: 100,
          layers: [],
        },
      ],
    });
    store.apply({
      apply: (scene) => ({
        ...scene,
        // Same page object refs, new array order (Pages panel path).
        pages: [scene.pages[1]!, scene.pages[0]!],
      }),
      label: "Reorder pages",
    });
    expect(store.getScene().pages.map((page) => page.id)).toStrictEqual([
      "p2",
      "p1",
    ]);
  });

  it("prunes stale selection after apply removes layers", () => {
    const store = new SceneStore();
    const pageId = store.getScene().pages[0]!.id;
    store.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                layers: [
                  { id: "a", type: "plugin.text", data: {} },
                  { id: "b", type: "plugin.text", data: {} },
                ],
              }
            : p
        ),
      }),
      label: "Add layers",
    });
    store.selectLayers(["a", "b"], "a");
    store.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((p) =>
          p.id === pageId
            ? { ...p, layers: p.layers.filter((layer) => layer.id !== "a") }
            : p
        ),
      }),
      label: "Delete layer",
    });
    expect(store.getSelection().selectedLayerIds).toStrictEqual(["b"]);
    expect(store.getSelection().primaryLayerId).toBe("b");
  });

  it("applies activePageId atomically with the scene transaction", () => {
    const store = new SceneStore({
      schemaVersion: 1,
      pages: [
        { id: "a", name: "A", layout: "flow", layers: [] },
        { id: "b", name: "B", layout: "flow", layers: [] },
        { id: "c", name: "C", layout: "flow", layers: [] },
      ],
    });
    store.setActivePage("c");
    const snapshots: string[] = [];
    store.subscribe((snap) => {
      snapshots.push(snap.editorState.activePageId);
    });
    snapshots.length = 0;
    store.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.filter((p) => p.id !== "c"),
      }),
      activePageId: "b",
      label: "Delete page",
    });
    expect(snapshots).toStrictEqual(["b"]);
    expect(store.getActivePageId()).toBe("b");
    expect(store.getScene().pages.map((p) => p.id)).toStrictEqual(["a", "b"]);
  });
});

describe(moveLayerToIndex, () => {
  const layers = [
    { data: {}, id: "a", type: "text" },
    { data: {}, id: "b", type: "text" },
    { data: {}, id: "c", type: "text" },
  ];

  it("moves layer to target index", () => {
    const result = moveLayerToIndex(layers, "c", 0);
    expect(result.map((l) => l.id)).toStrictEqual(["c", "a", "b"]);
  });

  it("returns same array when layer not found", () => {
    expect(moveLayerToIndex(layers, "missing", 0)).toBe(layers);
  });

  it("clamps target index", () => {
    expect(moveLayerToIndex(layers, "a", 99).map((l) => l.id)).toStrictEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("reorderLayers up/down delegates to moveLayerToIndex", () => {
    expect(reorderLayers(layers, "b", "up").map((l) => l.id)).toStrictEqual([
      "b",
      "a",
      "c",
    ]);
    expect(reorderLayers(layers, "b", "down").map((l) => l.id)).toStrictEqual([
      "a",
      "c",
      "b",
    ]);
  });
});

describe("SceneStore page rules", () => {
  it("rejects undimensioned absolute pages once page-rules lookup is wired", () => {
    const store = new SceneStore();
    store.setPageRulesLookup(() => {});
    expect(() =>
      store.setScene({
        schemaVersion: 2,
        pages: [
          {
            id: "p1",
            name: "Page",
            layout: "absolute",
            layers: [],
          },
        ],
      })
    ).toThrow(/width and height/);
  });

  it("accepts undimensioned absolute pages when lookup is unset", () => {
    const store = new SceneStore();
    store.setScene({
      schemaVersion: 2,
      pages: [
        {
          id: "p1",
          name: "Page",
          layout: "absolute",
          layers: [],
        },
      ],
    });
    expect(store.getScene().pages[0]!.width).toBeUndefined();
  });
});
