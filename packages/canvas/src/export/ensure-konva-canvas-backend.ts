import Konva from 'konva';

let configured = false;

type CanvasFactory = () => HTMLCanvasElement;

export function ensureKonvaCanvasBackend(createCanvas: CanvasFactory): void {
  if (configured) {
    return;
  }
  Konva.Util.createCanvasElement = createCanvas;
  configured = true;
}
