export const DEFAULT_THREAD_TITLE = 'New chat';

export function truncateThreadTitle(
  text: string,
  maxLength = 48
): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return DEFAULT_THREAD_TITLE;
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}
