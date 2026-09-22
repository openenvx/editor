import { describe, expect, it } from "vitest";

import { normalizeSceneForTest } from '../test/document-fixtures';
import { createContextKeyService } from "./context-key-service";

describe("ContextKeyService", () => {
  it("evaluates when expressions", () => {
    const scene = normalizeSceneForTest({});
    const keys = createContextKeyService();
    keys.syncSceneKeys({
      hasActiveEditor: true,
      isDirty: false,
      scene,
      selection: {
        activeArtboardId: scene.artboards[0]!.id,
        primaryNodeId: null,
        selectedNodeIds: [],
      },
    });

    expect(keys.evaluate("page.layoutFlow")).toBeTruthy();
    expect(keys.evaluate("scene.layerSelected")).toBeFalsy();
    expect(keys.evaluate("scene.multiPage")).toBeFalsy();
    expect(keys.evaluate("scene.primaryLayerType == 'canvas.svg'")).toBeFalsy();
    expect(keys.evaluate("page.layoutFlow && editor.hasActiveEditor")).toBeTruthy();
  });

  it("sets scene.primaryLayerType from the primary selection", () => {
    const scene = normalizeSceneForTest({
      pages: [
        {
          id: "a",
          layout: "absolute",
          layers: [
            {
              id: "svg-1",
              type: "canvas.svg",
              data: {
                svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
              },
            },
          ],
          name: "A",
        },
      ],
    });
    const keys = createContextKeyService();
    keys.syncSceneKeys({
      hasActiveEditor: true,
      isDirty: false,
      scene,
      selection: {
        activeArtboardId: "a",
        primaryNodeId: "svg-1",
        selectedNodeIds: ["svg-1"],
      },
    });
    expect(keys.evaluate("scene.primaryLayerType == 'canvas.svg'")).toBeTruthy();
  });

  it("sets scene.multiPage when more than one page exists", () => {
    const scene = normalizeSceneForTest({
      pages: [
        { id: "a", name: "A", layout: "flow", layers: [] },
        { id: "b", name: "B", layout: "flow", layers: [] },
      ],
    });
    const keys = createContextKeyService();
    keys.syncSceneKeys({
      hasActiveEditor: true,
      isDirty: false,
      scene,
      selection: {
        activeArtboardId: "a",
        primaryNodeId: null,
        selectedNodeIds: [],
      },
    });
    expect(keys.evaluate("scene.multiPage")).toBeTruthy();
  });
});
