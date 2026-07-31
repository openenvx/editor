type WidgetClickHandler = (layerId: string) => void;

let handler: WidgetClickHandler | null = null;

/**
 * Sandbox host binds this on activate so widget node clicks wake the isolate.
 * One handler at a time (last writer wins) — scoped to a single editor host.
 */
export function setOpenEnvxWidgetClickHandler(
  next: WidgetClickHandler | null
): () => void {
  handler = next;
  return () => {
    if (handler === next) {
      handler = null;
    }
  };
}

export function emitOpenEnvxWidgetClick(layerId: string): void {
  handler?.(layerId);
}
