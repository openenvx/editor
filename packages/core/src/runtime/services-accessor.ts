import type { ServiceId } from './create-service-id';

export interface ServicesAccessor {
  get<T>(id: ServiceId<T>): T;
  has(id: ServiceId<unknown>): boolean;
  createInstance<T>(
    ctor: abstract new (...args: never[]) => T,
    ...staticArgs: unknown[]
  ): T;
}

export function createServicesAccessor(
  get: <T>(id: ServiceId<T>) => T,
  has: (id: ServiceId<unknown>) => boolean,
  createInstance: <T>(
    ctor: abstract new (...args: never[]) => T,
    ...staticArgs: unknown[]
  ) => T
): ServicesAccessor {
  return { get, has, createInstance };
}
