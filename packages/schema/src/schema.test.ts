import { describe, expect, it } from "vitest";

import { createEmptyScene, normalizeScene, validateScene } from "./index";

describe("schema", () => {
  it("creates empty scene", () => {
    const scene = createEmptyScene();
    expect(scene.pages).toHaveLength(1);
    expect(scene.pages[0]!.layout).toBe("flow");
    expect(validateScene(scene).valid).toBeTruthy();
  });

  it("normalizes partial scene", () => {
    const scene = normalizeScene({
      pages: [{ id: "p1", layers: [], layout: "flow", name: "Test" }],
    });
    expect(scene.activePageId).toBe("p1");
    expect(scene.selection.activePageId).toBe("p1");
  });
});
