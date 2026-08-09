import type { Layer } from '@openenvx/core/schema';
import { describe, expect, it } from "vitest";

import type { Page } from "./types";
import {
  cloneLayerTree,
  getLayerAncestorIds,
  getLayerChildren,
  insertLayerIntoContainer,
  isLayerDescendant,
  moveLayerRelativeToTarget,
  updateLayerInTree,
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

  it("walkLayers visits children on any layer with data.children", () => {
    const groupLayers: Layer[] = [
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
    ];
    const ids: string[] = [];
    walkLayers(groupLayers, (layer) => ids.push(layer.id));
    expect(ids).toStrictEqual(["group-1", "child-1"]);
  });

  it("updateLayerInTree updates nested children in non-container layers", () => {
    const groupLayers: Layer[] = [
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
    ];
    const result = updateLayerInTree(groupLayers, "child-1", (layer) => ({
      ...layer,
      data: { fill: "#fff" },
    }));
    const groupLayer = result[0];
    const child = (groupLayer?.data as { children: Layer[] } | undefined)
      ?.children[0];
    expect(child?.data).toStrictEqual({ fill: "#fff" });
  });

  it("insertLayerIntoContainer works for non-container parents with children", () => {
    const groupLayers: Layer[] = [
      {
        data: { children: [] },
        id: "root",
        type: "html.root",
      },
    ];
    const result = insertLayerIntoContainer(
      groupLayers,
      "root",
      { id: "t1", type: "html.text", data: { text: "Hi" } },
      0
    );
    expect(getLayerChildren(result[0]!).map((l) => l.id)).toStrictEqual(["t1"]);
  });

  it("cloneLayerTree remaps ids including nested children", () => {
    const groupLayers: Layer[] = [
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
    ];
    const cloned = cloneLayerTree(groupLayers);
    expect(cloned).toHaveLength(1);
    expect(cloned[0]!.id).not.toBe("group-1");
    const children = (cloned[0]!.data as { children: Layer[] }).children;
    expect(children).toHaveLength(1);
    expect(children[0]!.id).not.toBe("child-1");
    expect(children[0]!.data).toStrictEqual({ fill: "#000" });
  });
});
