import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { ServiceId } from '../runtime/create-service-id';
import type { ServiceFactory } from '../runtime/instantiation-service';

export abstract class ServiceContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.Service;

  abstract readonly token: ServiceId<unknown>;

  abstract getFactory(): ServiceFactory;
}

export class SimpleServiceContribution<T> extends ServiceContribution {
  constructor(
    readonly token: ServiceId<T>,
    private readonly factory: ServiceFactory<T>
  ) {
    super();
  }

  getFactory(): ServiceFactory<T> {
    return this.factory;
  }
}

export class SingletonServiceContribution<T> extends ServiceContribution {
  constructor(
    readonly token: ServiceId<T>,
    private readonly ctor: abstract new (...args: never[]) => T
  ) {
    super();
  }

  getFactory(): ServiceFactory<T> {
    return (accessor) => accessor.createInstance(this.ctor);
  }
}
