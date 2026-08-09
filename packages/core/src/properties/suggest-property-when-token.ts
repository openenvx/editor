const PATH_PREFIXES = ['selection.', 'scene.layer.', 'plugin.'];

export function looksLikePropertyPathToken(token: string): boolean {
  return PATH_PREFIXES.some((prefix) => token.startsWith(prefix));
}

/** Suggestions for a when-expression token (context keys vs `$` paths). */
export function suggestPropertyWhenTokens(
  token: string,
  contextKeyNames: string[]
): string[] {
  if (token.startsWith('$')) {
    return [];
  }
  if (looksLikePropertyPathToken(token)) {
    return [`$${token}`];
  }
  const lower = token.toLowerCase();
  const firstSegment = token.split('.')[0];
  const matches = contextKeyNames.filter((key) => {
    if (key === token) {
      return false;
    }
    const keyLower = key.toLowerCase();
    return (
      keyLower.includes(lower) ||
      lower.includes(keyLower) ||
      key.startsWith(`${firstSegment}.`)
    );
  });
  return matches.slice(0, 3);
}
