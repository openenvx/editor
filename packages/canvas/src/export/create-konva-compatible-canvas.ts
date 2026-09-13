import { createCanvas } from '@napi-rs/canvas';

const emptyStyle = {
  background: '',
  border: '',
  height: '',
  left: '',
  margin: '',
  padding: '',
  position: '',
  top: '',
  width: '',
};

export function createKonvaCompatibleCanvas(
  width = 1,
  height = 1
): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  return Object.assign(canvas, {
    style: emptyStyle,
  }) as unknown as HTMLCanvasElement;
}
