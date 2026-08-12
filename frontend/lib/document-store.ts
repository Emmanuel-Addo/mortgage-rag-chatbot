class DocumentStore {
  private docs = new Map<string, { bytes: Buffer; mimeType: string }>();

  add(filename: string, bytes: Buffer, mimeType: string): void {
    this.docs.set(filename, { bytes, mimeType });
  }

  get(filename: string): { bytes: Buffer; mimeType: string } | undefined {
    return this.docs.get(filename);
  }

  getFilenames(): string[] {
    return [...this.docs.keys()];
  }

  delete(filename: string): void {
    this.docs.delete(filename);
  }
}

const globalForDocs = globalThis as unknown as { documentStore: DocumentStore };
export const documentStore = globalForDocs.documentStore || new DocumentStore();
if (!globalForDocs.documentStore) globalForDocs.documentStore = documentStore;
