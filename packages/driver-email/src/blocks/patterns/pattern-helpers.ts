/** Default child layer for pattern `defaultData.children` (visible in Layers). */
export function createDefaultChild(
  type: string,
  data: Record<string, unknown>
): { id: string; type: string; data: Record<string, unknown> } {
  return {
    id: `${type.replaceAll('.', '-')}-default`,
    type,
    data,
  };
}
