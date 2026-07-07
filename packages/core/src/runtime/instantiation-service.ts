import {
  createServiceId,
  getConstructorServiceParameters,
  getServiceDebugName,
} from './create-service-id';
import type { ServiceId } from './create-service-id';
import { createServicesAccessor } from './services-accessor';
import type { ServicesAccessor } from './services-accessor';

export type ServiceFactory<T = unknown> = (accessor: ServicesAccessor) => T;

export interface ServiceContainer {
  registerFactory<T>(id: ServiceId<T>, factory: ServiceFactory<T>): void;
  get<T>(id: ServiceId<T>): T;
  has(id: ServiceId<unknown>): boolean;
}

export class InstantiationService implements ServiceContainer {
  private readonly factories = new Map<ServiceId<unknown>, ServiceFactory>();
  private readonly instances = new Map<ServiceId<unknown>, unknown>();

  registerFactory<T>(id: ServiceId<T>, factory: ServiceFactory<T>): void {
    this.factories.set(id, factory as ServiceFactory);
    this.instances.delete(id);
  }

  registerInstance<T>(id: ServiceId<T>, instance: T): void {
    this.instances.set(id, instance);
    this.factories.delete(id);
  }

  has(id: ServiceId<unknown>): boolean {
    return this.factories.has(id) || this.instances.has(id);
  }

  get<T>(id: ServiceId<T>): T {
    if (this.instances.has(id)) {
      return this.instances.get(id) as T;
    }
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Service not found: ${getServiceDebugName(id)}`);
    }
    const accessor = createServicesAccessor(
      this.get.bind(this),
      this.has.bind(this),
      this.createInstance.bind(this)
    );
    const instance = factory(accessor);
    this.instances.set(id, instance);
    return instance as T;
  }

  registerSingleton<T>(
    id: ServiceId<T>,
    ctor: abstract new (...args: never[]) => T
  ): void {
    this.registerFactory(id, (accessor) => accessor.createInstance(ctor));
  }

  createInstance<T>(
    ctor: abstract new (...args: never[]) => T,
    ...staticArgs: unknown[]
  ): T {
    const paramMap = getConstructorServiceParameters(ctor);
    const maxIndex = Math.max(
      staticArgs.length - 1,
      paramMap.size > 0 ? Math.max(...paramMap.keys()) : -1
    );
    const args: unknown[] = [];
    for (let index = 0; index <= maxIndex; index += 1) {
      const serviceId = paramMap.get(index);
      if (serviceId) {
        args[index] = this.get(serviceId);
        continue;
      }
      if (index < staticArgs.length) {
        args[index] = staticArgs[index];
      }
    }
    return new (ctor as new (...args: unknown[]) => T)(...args);
  }

  clear(): void {
    this.factories.clear();
    this.instances.clear();
  }
}

export const InstantiationServiceId = createServiceId<InstantiationService>(
  'instantiationService'
);
