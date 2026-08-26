/**
 * Headless HTML export — no WorkbenchShell, TipTap, or component CSS.
 * Browser/editor hosts can import the same helpers from `@openenvx/email`.
 */
export {
  createEmailScene,
  renderEmailHtml,
  type RenderEmailHtmlOptions,
} from '@openenvx/driver-email/runtime';
export type { Scene } from '@openenvx/core/schema';
