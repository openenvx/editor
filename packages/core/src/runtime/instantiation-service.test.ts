import { describe, expect, it } from 'vitest';

import {
  TestConsumer,
  TestConsumerServiceId,
  TestService,
  TestServiceId,
} from './instantiation-service.fixtures';
import { InstantiationService } from './instantiation-service';

describe('InstantiationService', () => {
  it('resolves constructor dependencies via parameter decorators', () => {
    const services = new InstantiationService();
    services.registerFactory(TestServiceId, () => new TestService());

    const consumer = services.createInstance(TestConsumer);

    expect(consumer.dep.value).toBe(42);
  });

  it('registerSingleton resolves constructor dependencies', () => {
    const services = new InstantiationService();
    services.registerSingleton(TestServiceId, TestService);
    services.registerSingleton(TestConsumerServiceId, TestConsumer);

    const consumer = services.get(TestConsumerServiceId);

    expect(consumer.dep.value).toBe(42);
  });

  it('factory accessor createInstance wires dependencies', () => {
    const services = new InstantiationService();
    services.registerSingleton(TestServiceId, TestService);
    services.registerFactory(TestConsumerServiceId, (accessor) =>
      accessor.createInstance(TestConsumer)
    );

    const consumer = services.get(TestConsumerServiceId);

    expect(consumer.dep.value).toBe(42);
  });

  it('caches singleton instances per service id', () => {
    const services = new InstantiationService();
    let count = 0;
    services.registerFactory(TestServiceId, () => {
      count += 1;
      return new TestService();
    });

    services.get(TestServiceId);
    services.get(TestServiceId);

    expect(count).toBe(1);
  });

  it('registerSingleton caches one instance per service id', () => {
    const services = new InstantiationService();
    services.registerSingleton(TestServiceId, TestService);

    const first = services.get(TestServiceId);
    const second = services.get(TestServiceId);

    expect(first).toBe(second);
  });
});
