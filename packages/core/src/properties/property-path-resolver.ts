import type { PropertyValuePath } from './property-value-path';

export class PropertyValueHandle {
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

export interface PropertyHostContext {
  selectedLayerId: string | null;
  layerData: Record<string, unknown> | null;
  readPath(path: PropertyValuePath): unknown;
  writePath(path: PropertyValuePath, value: unknown): void;
}

export class PropertyPathResolver {
  constructor(private readonly ctx: PropertyHostContext) {}

  resolve(path: PropertyValuePath): PropertyValueHandle {
    return new PropertyValueHandle(
      () => this.ctx.readPath(path),
      (value) => this.ctx.writePath(path, value)
    );
  }
}
