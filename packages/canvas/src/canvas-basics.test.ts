import { normalizeScene } from '@xmazu/openenvxee-schema';
import { describe, expect, it } from "vitest";

import { CanvasRectLayer } from "./layers/canvas-rect-layer";
import { CanvasTextLayer } from "./layers/canvas-text-layer";

describe("canvas layers", () => {
  it("text layer renders richText preview descriptor", () => {
    const layer = new CanvasTextLayer();
    const scene = normalizeScene({
      activePageId: "p1",
      pages: [{ id: "p1", name: "Page", layout: "absolute", layers: [] }],
    });
    const created = layer.createDefault("t1", scene.pages[0]!);
    const view = layer.renderPreview({
      isSelected: false,
      layerId: created.id,
      model: layer.getModel(created),
    });
    expect(view.kind).toBe("richText");
    if (view.kind === "richText") {
      expect(view.html).toContain("Text");
      expect(view.lineHeight).toBe(1.4);
      expect(view.letterSpacing).toBe(0);
    }
  });

  it("exposes line spacing and letter spacing in default model", () => {
    const layer = new CanvasTextLayer();
    const scene = normalizeScene({
      activePageId: "p1",
      pages: [{ id: "p1", name: "Page", layout: "absolute", layers: [] }],
    });
    const created = layer.createDefault("t1", scene.pages[0]!);
    const model = layer.getModel(created);
    expect(model.lineHeight).toBe(1.4);
    expect(model.letterSpacing).toBe(0);
  });

  it("deserializes legacy plain text payloads", () => {
    const layer = new CanvasTextLayer();
    const model = layer.deserialize({
      text: "Hi",
      fontSize: 18,
    });
    expect(model.html).toBe("<p>Hi</p>");
    expect(model.fontSize).toBe(18);
  });

  it("rect layer renders preview descriptor", () => {
    const layer = new CanvasRectLayer();
    const scene = normalizeScene({
      activePageId: "p1",
      pages: [{ id: "p1", name: "Page", layout: "absolute", layers: [] }],
    });
    const created = layer.createDefault("r1", scene.pages[0]!);
    const view = layer.renderPreview({
      isSelected: false,
      layerId: created.id,
      model: layer.getModel(created),
    });
    expect(view.kind).toBe("rect");
  });
});
