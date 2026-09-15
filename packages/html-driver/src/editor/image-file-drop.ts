/** First image/* file from a FileList / File array / DataTransfer. */
export function firstImageFile(
  source: FileList | File[] | DataTransfer | null | undefined
): File | null {
  if (!source) {
    return null;
  }
  const files =
    typeof DataTransfer !== 'undefined' && source instanceof DataTransfer
      ? [...source.files]
      : [...(source as FileList | File[])];
  return files.find((file) => file.type.startsWith('image/')) ?? null;
}

export function dataTransferHasFiles(types: readonly string[]): boolean {
  return types.includes('Files');
}
