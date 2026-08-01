export interface ExtensionBlockPaletteEntry {
  id: string;
  label: string;
  /** Host command that drops the widget layer (`${id}.insert`). */
  insertCommandId: string;
}

type Listener = () => void;

/**
 * Host-side catalog of extension `contributes.blocks` for the HTML Blocks palette.
 * Filled when sandbox manifests activate; cleared on dispose / unmount.
 */
const entries = new Map<string, ExtensionBlockPaletteEntry>();
const listeners = new Set<Listener>();
let snapshot: ExtensionBlockPaletteEntry[] = [];

function rebuild(): void {
  snapshot = [...entries.values()];
  for (const listener of listeners) {
    listener();
  }
}

export const extensionBlockStore = {
  register(entry: ExtensionBlockPaletteEntry): { dispose(): void } {
    entries.set(entry.id, entry);
    rebuild();
    return {
      dispose: () => {
        entries.delete(entry.id);
        rebuild();
      },
    };
  },
  getSnapshot(): ExtensionBlockPaletteEntry[] {
    return snapshot;
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  clear(): void {
    entries.clear();
    rebuild();
  },
};
