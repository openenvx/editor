import {
  SANDBOX_CPU_BUDGET_PER_WINDOW_MS,
  SANDBOX_CPU_LIMIT_MS,
  SANDBOX_CPU_WINDOW_MS,
} from './sandbox-caps';

/** Each host-call round-trip charges this toward the cumulative CPU budget. */
export const HOST_CALL_CPU_CHARGE_MS = 25;

export interface SandboxCpuBudget {
  isExceeded: () => boolean;
  markExceeded: () => void;
  /** QuickJS interrupt handler: return true to stop execution. */
  shouldInterrupt: () => boolean;
  assert: () => void;
  withBudget: <T>(fn: () => T) => T;
  chargeHostCall: () => void;
}

/**
 * Sliding-window + per-burst CPU accounting for one QuickJS isolate.
 * Latch (`markExceeded`) is permanent for the isolate lifetime.
 */
export function createSandboxCpuBudget(input?: {
  cpuLimitMs?: number;
  cpuBudgetPerWindowMs?: number;
}): SandboxCpuBudget {
  const cpuLimitMs = input?.cpuLimitMs ?? SANDBOX_CPU_LIMIT_MS;
  const cpuBudgetPerWindowMs =
    input?.cpuBudgetPerWindowMs ?? SANDBOX_CPU_BUDGET_PER_WINDOW_MS;

  let deadlineMs = Number.POSITIVE_INFINITY;
  let burstStartedAt = 0;
  let windowStartedAt = Date.now();
  let cpuUsedInWindow = 0;
  let budgetExceeded = false;

  const rollWindow = (now: number): void => {
    if (now - windowStartedAt >= SANDBOX_CPU_WINDOW_MS) {
      windowStartedAt = now;
      cpuUsedInWindow = 0;
    }
  };

  const assert = (): void => {
    if (budgetExceeded || cpuUsedInWindow >= cpuBudgetPerWindowMs) {
      budgetExceeded = true;
      throw new Error('Sandbox CPU budget exceeded');
    }
  };

  const arm = (): void => {
    const now = Date.now();
    rollWindow(now);
    assert();
    const remainingBudget = cpuBudgetPerWindowMs - cpuUsedInWindow;
    const slice = Math.min(cpuLimitMs, Math.max(1, remainingBudget));
    burstStartedAt = now;
    deadlineMs = now + slice;
  };

  const disarm = (): void => {
    if (burstStartedAt > 0) {
      const elapsed = Date.now() - burstStartedAt;
      cpuUsedInWindow += Math.max(0, elapsed);
      burstStartedAt = 0;
      rollWindow(Date.now());
      if (cpuUsedInWindow >= cpuBudgetPerWindowMs) {
        budgetExceeded = true;
      }
    }
    deadlineMs = Number.POSITIVE_INFINITY;
  };

  return {
    isExceeded: () => budgetExceeded,
    markExceeded: () => {
      budgetExceeded = true;
    },
    shouldInterrupt: () => Date.now() >= deadlineMs,
    assert,
    withBudget: <T>(fn: () => T): T => {
      arm();
      try {
        return fn();
      } finally {
        disarm();
      }
    },
    chargeHostCall: () => {
      const now = Date.now();
      rollWindow(now);
      cpuUsedInWindow += HOST_CALL_CPU_CHARGE_MS;
      if (cpuUsedInWindow >= cpuBudgetPerWindowMs) {
        budgetExceeded = true;
      }
    },
  };
}

/** True when an error should permanently kill the isolate CPU budget. */
export function isSandboxCpuKillError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /Sandbox CPU (budget|limit) exceeded/i.test(message) ||
    /Sandbox eval timeout/i.test(message)
  );
}
