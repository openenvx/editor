import type { Layer } from '@openenvx/schema';
import { describe, expect, it } from "vitest";

import type { Page } from "./types";
import {
  getLayerAncestorIds,
  isLayerDescendant,
  moveLayerRelativeToTarget,
  walkLayers,
} from "./layer-tree";

describe("layer-tree", () => {
  const layers: Layer[] = [
    {
      data: {
        children: [
          { id: "a", type: "heading", data: { text: "A", level: 2 } },
          { id: "b", type: "heading", data: { text: "B", level: 2 } },
        ],
        layout: "row",
      },
      id: "c1",
      type: "container",
    },
    { data: { size: "md" }, id: "s1", type: "spacer" },
  ];

  it("walkLayers visits nested children", () => {
    const ids: string[] = [];
    walkLayers(layers, (layer) => ids.push(layer.id));
    expect(ids).toStrictEqual(["c1", "a", "b", "s1"]);
  });

  it("moveLayerRelativeToTarget reorders root layers", () => {
    const result = moveLayerRelativeToTarget(layers, "s1", "c1", "before");
    expect(result.map((l) => l.id)).toStrictEqual(["s1", "c1"]);
  });

  it("isLayerDescendant detects nested children", () => {
    expect(isLayerDescendant(layers, "c1", "a")).toBe(true);
    expect(isLayerDescendant(layers, "c1", "s1")).toBe(false);
    expect(isLayerDescendant(layers, "a", "c1")).toBe(false);
  });

  it("getLayerAncestorIds returns ancestor path for nested layers", () => {
    const page: Page = {
      id: "p1",
      layers,
      name: "Page",
    };
    expect(getLayerAncestorIds(page, "a")).toStrictEqual(["c1"]);
    expect(getLayerAncestorIds(page, "c1")).toStrictEqual([]);
    expect(getLayerAncestorIds(page, "missing")).toStrictEqual([]);
  });
});
