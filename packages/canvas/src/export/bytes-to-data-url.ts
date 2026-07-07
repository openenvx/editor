const CHUNK_SIZE = 0x80_00;

export function bytesToDataUrl(data: Uint8Array, mimeType: string): string {
  let binary = '';
  for (let index = 0; index < data.length; index += CHUNK_SIZE) {
    const chunk = data.subarray(index, index + CHUNK_SIZE);
    binary += String.fromCodePoint(...chunk);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export function downloadBytes(
  data: Uint8Array,
  mimeType: string,
  fileName: string
): void {
  const blob = new Blob([Uint8Array.from(data)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
