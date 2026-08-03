/**
 * Document-level email font (react-email `Font` + live artboard).
 * Canvas FontService is intentionally not used — email clients need
 * @font-face + a web-safe fallback stack.
 */

export const EMAIL_FONT_FAMILY = 'Inter';

export const EMAIL_FALLBACK_FONT_FAMILY = [
  'Arial',
  'Helvetica',
  'sans-serif',
] as const satisfies readonly (
  | 'Arial'
  | 'Helvetica'
  | 'Verdana'
  | 'Georgia'
  | 'Times New Roman'
  | 'serif'
  | 'sans-serif'
  | 'monospace'
  | 'cursive'
  | 'fantasy'
)[];

/**
 * Latin Inter variable face — same file for 400 / 600 / 700 (Google Fonts CSS).
 * Declare one @font-face per weight so bold headings are not synthesized.
 */
export const EMAIL_FONT_WOFF2_URL =
  'https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2';

export const EMAIL_FONT_WEIGHTS = [400, 600, 700] as const;

export const EMAIL_WEB_FONT = {
  url: EMAIL_FONT_WOFF2_URL,
  format: 'woff2' as const,
};

export function emailFontStack(): string {
  return `${EMAIL_FONT_FAMILY}, ${EMAIL_FALLBACK_FONT_FAMILY.join(', ')}`;
}

/** Explicit heading metrics — avoid browser UA h1/h2 sizes (differ host vs iframe). */
export function emailHeadingStyle(level: 1 | 2 | 3): {
  fontSize: number;
  fontWeight: number;
  lineHeight: string;
} {
  switch (level) {
    case 1: {
      return { fontSize: 28, fontWeight: 600, lineHeight: '1.3' };
    }
    case 2: {
      return { fontSize: 22, fontWeight: 600, lineHeight: '1.3' };
    }
    default: {
      return { fontSize: 18, fontWeight: 600, lineHeight: '1.3' };
    }
  }
}

function emailFontFaceCss(weight: number): string {
  return `
@font-face {
  font-family: '${EMAIL_FONT_FAMILY}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url(${EMAIL_FONT_WOFF2_URL}) format('woff2');
}
`;
}

const EDITOR_FACE_STYLE_ID = 'openenvx-email-document-font';

/** Load the document web font into the host page for live edit fidelity. */
export function ensureEmailDocumentFont(): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.querySelector(`#${EDITOR_FACE_STYLE_ID}`)) {
    return;
  }
  const style = document.createElement('style');
  style.id = EDITOR_FACE_STYLE_ID;
  style.textContent = EMAIL_FONT_WEIGHTS.map(emailFontFaceCss).join('');
  document.head.append(style);
}
