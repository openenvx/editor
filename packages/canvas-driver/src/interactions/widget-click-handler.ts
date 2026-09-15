type WidgetPointerHandler = (targetLayerId: string) => void;

let handler: WidgetPointerHandler | null = null;

/**
 * Sandbox host binds this so pointer hits on a widget or its face children
 * resolve to handler ids in the isolate.
 */
export function setOpenEnvxWidgetClickHandler(
  next: WidgetPointerHandler | null
): () => void {
  handler = next;
  return () => {
    if (handler === next) {
      handler = null;
    }
  };
}

/** Notify the host of a pointer hit on any stage layer (host filters ancestry). */
export function emitOpenEnvxWidgetClick(targetLayerId: string): void {
  handler?.(targetLayerId);
}
