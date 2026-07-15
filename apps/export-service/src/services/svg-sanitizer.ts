const SCRIPT_TAG_PATTERN =
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_PATTERN = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const FOREIGN_OBJECT_PATTERN =
  /<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi;
const EXTERNAL_HREF_PATTERN =
  /(?:href|xlink:href)\s*=\s*(?:"(?!data:)[^"]*"|'(?!data:)[^']*')/gi;
const EXTERNAL_URL_PATTERN = /url\(\s*(?!"data:)(?!"asset:\/\/)[^)]+\)/gi;

export function sanitizeRawSvg(svg: string): string {
  return svg
    .replaceAll(SCRIPT_TAG_PATTERN, '')
    .replaceAll(FOREIGN_OBJECT_PATTERN, '')
    .replaceAll(EVENT_HANDLER_PATTERN, '')
    .replaceAll(EXTERNAL_HREF_PATTERN, '')
    .replaceAll(EXTERNAL_URL_PATTERN, '');
}
