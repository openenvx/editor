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

  it("accepts nested layer ids in selection", () => {
    const scene = normalizeScene({
      activePageId: "p1",
      pages: [
        {
          id: "p1",
          layout: "absolute",
          name: "Page",
          width: 800,
          height: 600,
          layers: [
            {
              data: {
                children: [
                  {
                    id: "child-1",
                    type: "canvas.rect",
                    data: { fill: "#000" },
                  },
                ],
              },
              id: "group-1",
              type: "canvas.group",
            },
          ],
        },
      ],
      selection: {
        activePageId: "p1",
        primaryLayerId: "child-1",
        selectedLayerIds: ["child-1"],
      },
    });

    expect(validateScene(scene).valid).toBe(true);
  });
});
