const FONT_LOAD_SPECS = ['16px', 'bold 16px', 'italic 16px'] as const;

export async function loadCanvasFonts(families: string[]): Promise<void> {
  if (typeof document === 'undefined') {
    return;
  }

  const uniqueFamilies = [...new Set(families.filter(Boolean))];
  if (uniqueFamilies.length === 0) {
    return;
  }

  await Promise.all(
    uniqueFamilies.flatMap((family) =>
      FONT_LOAD_SPECS.map((spec) =>
        document.fonts.load(`${spec} ${family}`).catch(() => {})
      )
    )
  );
}
