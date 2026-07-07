export interface IconRegistry {
  register(id: string, glyph: unknown): void;
  registerDefaults(glyphs: Record<string, unknown>): void;
  resolve(id: string): unknown | null;
}

export class IconRegistryImpl implements IconRegistry {
  private readonly glyphs = new Map<string, unknown>();

  register(id: string, glyph: unknown): void {
    this.glyphs.set(id, glyph);
  }

  registerDefaults(glyphs: Record<string, unknown>): void {
    for (const [id, glyph] of Object.entries(glyphs)) {
      this.register(id, glyph);
    }
  }

  resolve(id: string): unknown | null {
    return this.glyphs.get(id) ?? null;
  }
}
