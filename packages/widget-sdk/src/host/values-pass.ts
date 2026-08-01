/**
 * Module-local values write-back for Node / unit tests.
 * Isolate hosts install `openenvx.widget.applyProps` instead.
 */

let activeValues: Record<string, unknown> | null = null;
let activeOnChange: ((values: Record<string, unknown>) => void) | null = null;

/** Start a values pass. Returns true when this call owns the pass. */
export function beginValuesPass(
  values?: Record<string, unknown>,
  onValuesChange?: (values: Record<string, unknown>) => void
): boolean {
  if (!onValuesChange) {
    return false;
  }
  activeValues = { ...values };
  activeOnChange = onValuesChange;
  return true;
}

export function endValuesPass(): void {
  activeValues = null;
  activeOnChange = null;
}

export function applyPropsPatch(patch: Record<string, unknown>): void {
  const hostApply = (
    globalThis as typeof globalThis & {
      openenvx?: {
        widget?: { applyProps?: (p: Record<string, unknown>) => void };
      };
    }
  ).openenvx?.widget?.applyProps;
  if (hostApply) {
    hostApply(patch);
    return;
  }
  if (!(activeValues && activeOnChange)) {
    throw new Error(
      'setProps called outside a values pass (no openenvx.widget.applyProps)'
    );
  }
  Object.assign(activeValues, patch);
  activeOnChange({ ...activeValues });
}
