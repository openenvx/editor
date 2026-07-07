import { describe, expect, it } from "vitest";

import { moveLayerToIndex, reorderLayers, SceneStore } from "./scene-store";

describe(SceneStore, () => {
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
