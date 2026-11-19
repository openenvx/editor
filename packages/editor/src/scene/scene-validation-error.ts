export class DocumentValidationError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(`Invalid document: ${errors.join('; ')}`);
    this.name = 'DocumentValidationError';
    this.errors = errors;
  }
}
