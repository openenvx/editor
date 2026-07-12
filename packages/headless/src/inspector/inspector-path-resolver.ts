import type { InspectorValuePath } from './inspector-value-path';

export class InspectorValueHandle {
  constructor(
    private readonly readFn: () => unknown,
    private readonly writeFn: (value: unknown) => void
  ) {}

  read(): unknown {
    return this.readFn();
  }

  write(value: unknown): void {
    this.writeFn(value);
  }
}

export interface InspectorHostContext {
  selectedLayerId: string | null;
  layerData: Record<string, unknown> | null;
  readPath(path: InspectorValuePath): unknown;
  writePath(path: InspectorValuePath, value: unknown): void;
}

export class InspectorPathResolver {
  constructor(private readonly ctx: InspectorHostContext) {}

  resolve(path: InspectorValuePath): InspectorValueHandle {
    return new InspectorValueHandle(
      () => this.ctx.readPath(path),
      (value) => this.ctx.writePath(path, value)
    );
  }
}
