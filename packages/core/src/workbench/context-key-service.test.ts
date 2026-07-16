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
    expect(keys.evaluate("page.layoutFlow && editor.hasActiveEditor")).toBeTruthy();
  });
});
