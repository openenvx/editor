/**
 * Headless email export — block configs + React-Email render.
 * Does not pull WorkbenchShell, TipTap editors, or DnD chrome.
 */
export { createEmailDemoScene as createEmailScene } from './create-email-demo-scene';
export { renderEmailDocument } from './render/render-email-document';
export {
  renderEmailHtml,
  type RenderEmailHtmlOptions,
} from './render/render-email-html';
