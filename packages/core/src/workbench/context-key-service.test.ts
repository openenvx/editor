import { normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from "vitest";

import { createContextKeyService } from "./context-key-service";

describe("ContextKeyService", () => {
  it("evaluates when expressions", () => {
    const scene = normalizeScene({});
    const keys = createContextKeyService();
    keys.syncSceneKeys({
      hasActiveEditor: true,
      isDirty: false,
      scene,
      selection: {
        activePageId: scene.pages[0]!.id,
        primaryLayerId: null,
        selectedLayerIds: [],
      },
    });

    expect(keys.evaluate("page.layoutFlow")).toBeTruthy();
    expect(keys.evaluate("scene.layerSelected")).toBeFalsy();
    expect(keys.evaluate("scene.multiPage")).toBeFalsy();
    expect(keys.evaluate("scene.primaryLayerType == 'canvas.svg'")).toBeFalsy();
    expect(keys.evaluate("page.layoutFlow && editor.hasActiveEditor")).toBeTruthy();
  });

  it("sets scene.primaryLayerType from the primary selection", () => {
    const scene = normalizeScene({
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
        activePageId: "a",
        primaryLayerId: "svg-1",
        selectedLayerIds: ["svg-1"],
      },
    });
    expect(keys.evaluate("scene.primaryLayerType == 'canvas.svg'")).toBeTruthy();
  });

  it("sets scene.multiPage when more than one page exists", () => {
    const scene = normalizeScene({
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
        activePageId: "a",
        primaryLayerId: null,
        selectedLayerIds: [],
      },
    });
    expect(keys.evaluate("scene.multiPage")).toBeTruthy();
  });
});
