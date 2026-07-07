const SERVICE_DEBUG_NAME = Symbol('serviceDebugName');

const ctorParamMap = new WeakMap<object, Map<number, ServiceId<unknown>>>();

export type ServiceId<T> = ParameterDecorator & {
  readonly __serviceBrand?: T;
};

export function getServiceDebugName(id: ServiceId<unknown>): string {
  return (
    (id as unknown as Record<symbol, string>)[SERVICE_DEBUG_NAME] ?? 'unknown'
  );
}

export function createServiceId<T>(debugName: string): ServiceId<T> {
  const decorator = ((
    target: object,
    _propertyKey: string | symbol | undefined,
    parameterIndex: number
  ): void => {
    let params = ctorParamMap.get(target);
    if (!params) {
      params = new Map();
      ctorParamMap.set(target, params);
    }
    params.set(parameterIndex, decorator as ServiceId<unknown>);
  }) as ServiceId<T>;

  Object.defineProperty(decorator, SERVICE_DEBUG_NAME, {
    value: debugName,
  });

  return decorator;
}

export function getConstructorServiceParameters(
  ctor: abstract new (...args: never[]) => unknown
): Map<number, ServiceId<unknown>> {
  return ctorParamMap.get(ctor) ?? new Map();
}
