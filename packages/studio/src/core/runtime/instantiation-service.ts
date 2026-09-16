import {
  createServiceId,
  getServiceDebugName,
  runWithInjectionContext,
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
    const accessor = this.createAccessor();
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
    const accessor = this.createAccessor();
    return runWithInjectionContext(
      accessor,
      () => new (ctor as new (...args: unknown[]) => T)(...staticArgs)
    );
  }

  clear(): void {
    this.factories.clear();
    this.instances.clear();
  }

  private createAccessor(): ServicesAccessor {
    return createServicesAccessor(
      this.get.bind(this),
      this.has.bind(this),
      this.createInstance.bind(this)
    );
  }
}

export const InstantiationServiceId = createServiceId<InstantiationService>(
  'instantiationService'
);
