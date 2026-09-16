import { createServiceId, inject } from './create-service-id';

export const TestServiceId = createServiceId<TestService>('testService');
export const TestConsumerServiceId =
  createServiceId<TestConsumer>('testConsumer');

export class TestService {
  readonly value = 42;
}

export class TestConsumer {
  readonly dep = inject(TestServiceId);
}
