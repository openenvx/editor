export class SceneValidationError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(`Invalid scene: ${errors.join('; ')}`);
    this.name = 'SceneValidationError';
    this.errors = errors;
  }
}
