import { createServiceId } from './create-service-id';

export const TestServiceId = createServiceId<TestService>('testService');
export const TestConsumerServiceId =
  createServiceId<TestConsumer>('testConsumer');

export class TestService {
  readonly value = 42;
}

export class TestConsumer {
  constructor(@TestServiceId public readonly dep: TestService) {}
}
