export interface DocumentHostService {
  promptOpen(): Promise<string | null | undefined>;
  promptSaveAs(): Promise<string | null | undefined>;
  canPromptOpen(): boolean;
  canPromptSaveAs(): boolean;
}

export interface DocumentHostBindings {
  promptOpen: () => Promise<string | null | undefined>;
  promptSaveAs: () => Promise<string | null | undefined>;
}

export interface DocumentHostConfiguration {
  promptOpen?: boolean;
  promptSaveAs?: boolean;
}

export class MutableDocumentHostService implements DocumentHostService {
  private bindings: DocumentHostBindings = {
    promptOpen: () => Promise.resolve(null),
    promptSaveAs: () => Promise.resolve(null),
  };
  private promptOpenEnabled = false;
  private promptSaveAsEnabled = false;

  configurePrompts(options: DocumentHostConfiguration): void {
    this.promptOpenEnabled = options.promptOpen ?? false;
    this.promptSaveAsEnabled = options.promptSaveAs ?? false;
  }

  updateBindings(bindings: Partial<DocumentHostBindings>): void {
    this.bindings = { ...this.bindings, ...bindings };
  }

  canPromptOpen(): boolean {
    return this.promptOpenEnabled;
  }

  canPromptSaveAs(): boolean {
    return this.promptSaveAsEnabled;
  }

  promptOpen(): Promise<string | null | undefined> {
    return this.bindings.promptOpen();
  }

  promptSaveAs(): Promise<string | null | undefined> {
    return this.bindings.promptSaveAs();
  }
}
