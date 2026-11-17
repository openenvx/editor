export interface DocumentOperationsService {
  save(): Promise<void>;
  saveAs(uri: string): Promise<void>;
  openDocument(uri: string): Promise<void>;
}
