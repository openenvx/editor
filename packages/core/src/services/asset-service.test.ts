import { InMemoryAssetService } from '@openenvx/core';
import { createEmptyScene } from '@openenvx/schema';
import { describe, expect, it } from "vitest";

function createPngBlob(): Blob {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  return new Blob([bytes], { type: "image/png" });
}

describe(InMemoryAssetService, () => {
  it("resolves http URLs unchanged", () => {
    const service = new InMemoryAssetService();
    expect(service.resolveUrl("https://example.com/a.png")).toBe(
      "https://example.com/a.png"
    );
  });

  it("resolves asset refs to base64 data URLs after register", () => {
    const service = new InMemoryAssetService();
    service.register("abc", { data: "bXk=", encoding: "base64", mimeType: "image/png" });
    expect(service.resolveUrl("asset://abc")).toBe("data:image/png;base64,bXk=");
  });

  it("uploads a file and resolves it as a base64 data URL", async () => {
    const service = new InMemoryAssetService();
    const file = new File([createPngBlob()], "test.png", { type: "image/png" });
    const ref = await service.upload(file);

    expect(ref.startsWith("asset://")).toBe(true);
    expect(service.resolveUrl(ref)).toBe(
      "data:image/png;base64,iVBORw=="
    );
  });

  it("hydrates from scene assets and exports only referenced assets", () => {
    const service = new InMemoryAssetService();
    service.register("a", { data: "aQ==", encoding: "base64", mimeType: "image/png" });
    service.register("b", { data: "Yg==", encoding: "base64", mimeType: "image/png" });

    const scene = {
      ...createEmptyScene(),
      pages: [
        {
          ...createEmptyScene().pages[0]!,
          layers: [
            {
              data: { assetRef: "asset://a" },
              id: "1",
              type: "image",
            },
          ],
        },
      ],
    };

    const exported = service.exportReferenced(scene);
    expect(exported).toEqual({
      a: { data: "aQ==", encoding: "base64", mimeType: "image/png" },
    });
  });

  it("round-trips through hydrate", () => {
    const service = new InMemoryAssetService();
    service.hydrate({
      x: { data: "eHk=", encoding: "base64", mimeType: "image/png" },
    });

    expect(service.resolveUrl("asset://x")).toBe("data:image/png;base64,eHk=");

    service.hydrate({});
    expect(service.resolveUrl("asset://x")).toBe("asset://x");
  });
});
