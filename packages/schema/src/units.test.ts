import { normalizeScene } from '@xmazu/openenvxee-schema';
import { describe, expect, it } from "vitest";

describe("schema units", () => {
  it("normalizes page unit and dpi", () => {
    const scene = normalizeScene({
      pages: [
        {
          id: "p1",
          name: "Print",
          layout: "absolute",
          unit: "mm",
          width: 210,
          height: 297,
          layers: [],
        },
      ],
    });
    expect(scene.pages[0]?.unit).toBe("mm");
    expect(scene.pages[0]?.dpi).toBe(96);
  });

  it("normalizes nested container children", () => {
    const scene = normalizeScene({
      pages: [
        {
          id: "p1",
          name: "Flow",
          layout: "flow",
          layers: [
            {
              id: "c1",
              type: "container",
              data: {
                layout: "row",
                children: [
                  { id: "h1", type: "heading", data: { level: 2, text: "Hi" } },
                ],
              },
            },
          ],
        },
      ],
    });
    const container = scene.pages[0]!.layers[0]!;
    const {children} = (container.data as { children: { id: string }[] });
    expect(children[0]?.id).toBe("h1");
  });
});
