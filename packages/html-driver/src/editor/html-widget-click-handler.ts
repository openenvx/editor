type WidgetPointerHandler = (targetLayerId: string) => void;

let handler: WidgetPointerHandler | null = null;

/** Sandbox host binds this so pointer hits on HTML widget face children resolve handlers. */
export function setOpenEnvxHtmlWidgetClickHandler(
  next: WidgetPointerHandler | null
): () => void {
  handler = next;
  return () => {
    if (handler === next) {
      handler = null;
    }
  };
}

export function emitOpenEnvxHtmlWidgetClick(targetLayerId: string): void {
  handler?.(targetLayerId);
}
