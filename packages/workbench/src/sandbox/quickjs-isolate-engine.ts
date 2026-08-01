import {
  SANDBOX_BRIDGE_SOURCE,
  type SandboxBridgeRequest,
  type SandboxBridgeResponse,
} from '@openenvx/protocol';

import { sandboxBootstrapSource } from './sandbox-bootstrap-source';
import {
  SANDBOX_EVAL_TIMEOUT_MS,
  SANDBOX_MEMORY_LIMIT_BYTES,
} from './sandbox-caps';
import {
  createSandboxCpuBudget,
  isSandboxCpuKillError,
} from './sandbox-cpu-budget';

export type HostCallFn = (
  request: SandboxBridgeRequest
) => Promise<SandboxBridgeResponse>;

export interface QuickJsEngine {
  evalModule: (source: string) => Promise<unknown>;
  deliverUiMessage: (payload: unknown) => void;
  dispose: () => void;
}

export { SANDBOX_CPU_LIMIT_MS } from './sandbox-caps';

/**
 * Runs one QuickJS isolate. Call only from a Worker (or test fallback).
 * Extension JS never touches the editor main world.
 *
 * CPU model:
 * - Each sync burst gets up to `cpuLimitMs` wall-clock.
 * - Cumulative CPU across host-call resumes is capped per sliding window.
 * - `evalModule` drains async work until idle or `SANDBOX_EVAL_TIMEOUT_MS`.
 */
export async function createQuickJsEngine(input: {
  onHostCall: HostCallFn;
  /** Override per-burst CPU budget (tests). */
  cpuLimitMs?: number;
  /** Override cumulative window budget (tests). */
  cpuBudgetPerWindowMs?: number;
  /** Override eval wall-clock including async (tests). */
  evalTimeoutMs?: number;
}): Promise<QuickJsEngine> {
  const evalTimeoutMs = input.evalTimeoutMs ?? SANDBOX_EVAL_TIMEOUT_MS;
  const cpu = createSandboxCpuBudget({
    cpuLimitMs: input.cpuLimitMs,
    cpuBudgetPerWindowMs: input.cpuBudgetPerWindowMs,
  });
  const quickjs = await import('quickjs-emscripten');
  const QuickJS = await quickjs.getQuickJS();
  const runtime = QuickJS.newRuntime();
  // Soft ceiling; upgrade path: per-extension memory budget from mint grant.
  runtime.setMemoryLimit(SANDBOX_MEMORY_LIMIT_BYTES);
  runtime.setInterruptHandler(() => cpu.shouldInterrupt());

  const context = runtime.newContext();
  let inFlightHostCalls = 0;

  const formatEvalError = (errorHandle: { dispose: () => void }): string => {
    const dumped = context.dump(errorHandle as never);
    errorHandle.dispose();
    if (typeof dumped === 'string') {
      return dumped;
    }
    if (dumped && typeof dumped === 'object') {
      const record = dumped as { message?: unknown; name?: unknown };
      const parts = [record.name, record.message].filter(
        (part) => part !== undefined && part !== null && part !== ''
      );
      if (parts.length > 0) {
        return parts.map(String).join(': ');
      }
      try {
        return JSON.stringify(dumped);
      } catch {
        return String(dumped);
      }
    }
    return String(dumped);
  };

  const throwIfInterrupted = (text: string): never => {
    if (/interrupt/i.test(text) || cpu.isExceeded()) {
      throw new Error(
        cpu.isExceeded()
          ? 'Sandbox CPU budget exceeded'
          : 'Sandbox CPU limit exceeded'
      );
    }
    throw new Error(`Sandbox eval failed: ${text}`);
  };

  const assertEvalOk = (result: {
    error?: { dispose: () => void };
    value?: { dispose: () => void } | null;
  }): void => {
    if (result.error) {
      throwIfInterrupted(formatEvalError(result.error));
    }
    try {
      result.value?.dispose();
    } catch {
      // Handle already freed.
    }
  };

  const dumpEvalResult = (result: {
    error?: { dispose: () => void };
    value?: { dispose: () => void } | null;
  }): unknown => {
    if (result.error) {
      throwIfInterrupted(formatEvalError(result.error));
    }
    if (!result.value) {
      return undefined;
    }
    try {
      return context.dump(result.value as never);
    } finally {
      try {
        result.value.dispose();
      } catch {
        // Handle already freed by dump/runtime.
      }
    }
  };

  const hostHandle = context.newFunction('__openenvxHostCall', (reqHandle) => {
    const raw = context.dump(reqHandle);
    const promise = context.newPromise();
    if (cpu.isExceeded()) {
      const value = context.newString(
        JSON.stringify({
          source: SANDBOX_BRIDGE_SOURCE,
          v: 1,
          id: 'error',
          ok: false,
          error: 'Sandbox CPU budget exceeded',
        } satisfies SandboxBridgeResponse)
      );
      promise.resolve(value);
      value.dispose();
      return promise.handle;
    }
    inFlightHostCalls += 1;
    void (async () => {
      try {
        if (cpu.isExceeded()) {
          throw new Error('Sandbox CPU budget exceeded');
        }
        cpu.assert();
        const request = raw as SandboxBridgeRequest;
        if (
          !request ||
          typeof request !== 'object' ||
          request.source !== SANDBOX_BRIDGE_SOURCE
        ) {
          throw new Error('Invalid host call');
        }
        const response = await input.onHostCall(request);
        if (cpu.isExceeded()) {
          throw new Error('Sandbox CPU budget exceeded');
        }
        const value = context.newString(JSON.stringify(response));
        promise.resolve(value);
        value.dispose();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const value = context.newString(
          JSON.stringify({
            source: SANDBOX_BRIDGE_SOURCE,
            v: 1,
            id: 'error',
            ok: false,
            error: message,
          } satisfies SandboxBridgeResponse)
        );
        promise.resolve(value);
        value.dispose();
      } finally {
        inFlightHostCalls = Math.max(0, inFlightHostCalls - 1);
        // Charge host-call round-trips so async await loops cannot dodge the budget.
        cpu.chargeHostCall();
        try {
          if (!cpu.isExceeded()) {
            cpu.withBudget(() => {
              context.runtime.executePendingJobs();
            });
          }
        } catch (error) {
          if (isSandboxCpuKillError(error)) {
            cpu.markExceeded();
          }
        }
      }
    })();
    return promise.handle;
  });
  context.setProp(context.global, '__openenvxHostCall', hostHandle);
  hostHandle.dispose();

  try {
    const bootResult = cpu.withBudget(() =>
      context.evalCode(sandboxBootstrapSource())
    );
    assertEvalOk(bootResult);
  } catch (error) {
    context.dispose();
    runtime.dispose();
    const text = error instanceof Error ? error.message : String(error);
    throw new Error(
      text.startsWith('Sandbox ')
        ? text.replace(/^Sandbox eval failed/, 'Sandbox bootstrap failed')
        : `Sandbox bootstrap failed: ${text}`,
      { cause: error }
    );
  }

  const endHeldRenderPass = (): void => {
    try {
      cpu.withBudget(() => {
        const result = context.evalCode(`(function () {
          var w = globalThis.openenvx && globalThis.openenvx.widget;
          if (w && typeof w._endRenderPass === 'function') {
            w._endRenderPass();
          }
        })()`);
        assertEvalOk(result);
      });
    } catch {
      // Best-effort clear; budget errors already thrown from evalModule.
    }
  };

  const drainUntilIdle = async (wallDeadline: number): Promise<void> => {
    // Pump host-call round-trips + QuickJS jobs until idle.
    // Always yield to the host event loop so `onHostCall` async work can settle.
    while (Date.now() < wallDeadline) {
      cpu.assert();
      cpu.withBudget(() => {
        const jobs = context.runtime.executePendingJobs();
        if (typeof jobs === 'number' && jobs < 0) {
          throw new Error('Sandbox eval failed: pending jobs error');
        }
      });
      if (inFlightHostCalls === 0) {
        // One more turn for promise reactions scheduled by resolve.
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
        cpu.assert();
        cpu.withBudget(() => {
          context.runtime.executePendingJobs();
        });
        if (inFlightHostCalls === 0) {
          return;
        }
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    }
    cpu.markExceeded();
    throw new Error('Sandbox eval timeout');
  };

  return {
    async evalModule(source: string) {
      const wallDeadline = Date.now() + evalTimeoutMs;
      let result: {
        error?: { dispose: () => void };
        value?: { dispose: () => void } | null;
      } | null = null;
      try {
        cpu.assert();
        result = cpu.withBudget(() => context.evalCode(source));
        if (result.error) {
          throwIfInterrupted(formatEvalError(result.error));
        }
        await drainUntilIdle(wallDeadline);
        return dumpEvalResult(result);
      } catch (error) {
        if (isSandboxCpuKillError(error)) {
          cpu.markExceeded();
        }
        if (result?.value) {
          try {
            result.value.dispose();
          } catch {
            // already freed
          }
        }
        if (result?.error) {
          try {
            result.error.dispose();
          } catch {
            // already freed
          }
        }
        throw error;
      } finally {
        endHeldRenderPass();
      }
    },
    deliverUiMessage(payload: unknown) {
      const encoded = JSON.stringify(payload ?? null);
      try {
        const result = cpu.withBudget(() =>
          context.evalCode(
            `(function (payload) {
            const ui = globalThis.openenvx && globalThis.openenvx.ui;
            if (ui && typeof ui.onmessage === 'function') {
              ui.onmessage(payload);
            }
          })(${encoded})`
          )
        );
        assertEvalOk(result);
        cpu.withBudget(() => {
          context.runtime.executePendingJobs();
        });
      } finally {
        endHeldRenderPass();
      }
    },
    dispose() {
      inFlightHostCalls = 0;
      context.dispose();
      runtime.dispose();
    },
  };
}
