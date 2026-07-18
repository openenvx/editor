import type { ServicesAccessor } from './services-accessor';

const SERVICE_DEBUG_NAME = Symbol('serviceDebugName');

export interface ServiceId<T> {
  readonly __serviceBrand?: T;
}

export function getServiceDebugName(id: ServiceId<unknown>): string {
  return (
    (id as unknown as Record<symbol, string>)[SERVICE_DEBUG_NAME] ?? 'unknown'
  );
}

export function createServiceId<T>(debugName: string): ServiceId<T> {
  const id = {} as ServiceId<T>;
  Object.defineProperty(id, SERVICE_DEBUG_NAME, {
    value: debugName,
  });
  return id;
}

let currentAccessor: ServicesAccessor | undefined;

/**
 * Resolve a service from the active InstantiationService.createInstance context.
 * Use as a field initializer:
 *   private readonly assets = inject(AssetServiceId);
 */
export function inject<T>(id: ServiceId<T>): T {
  if (!currentAccessor) {
    throw new Error(
      `inject(${getServiceDebugName(id)}) called outside InstantiationService.createInstance`
    );
  }
  return currentAccessor.get(id);
}

export function runWithInjectionContext<T>(
  accessor: ServicesAccessor,
  fn: () => T
): T {
  const previous = currentAccessor;
  currentAccessor = accessor;
  try {
    return fn();
  } finally {
    currentAccessor = previous;
  }
}
