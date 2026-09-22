import {
  InstantiationService,
  type AssetService,
} from '@openenvx/studio';
import { nodeTransform } from '@openenvx/studio/schema';
import { testArtboard } from '../test/canvas-document-fixtures';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CanvasClipboardService } from './canvas-clipboard-service';
import {
  clearImagePastePreviewsForTests,
  getImagePastePreview,
} from './image-paste-preview';

describe(CanvasClipboardService, () => {
  afterEach(() => {
    clearImagePastePreviewsForTests();
    vi.restoreAllMocks();
  });

  it('creates a preview layer immediately and uploads on finalize', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const upload = vi.fn().mockResolvedValue('https://cdn.example/a.png');
    const assets: AssetService = {
      resolveUrl: (ref) => ref,
      upload,
    };

    const services = new InstantiationService();
    const clipboard = services.createInstance(CanvasClipboardService);

    const page = testArtboard({ id: 'p1', name: 'Page' }, 'absolute');
    const paste = clipboard.createImageLayerFromExternalPaste(
      page,
      { x: 12, y: 34 },
      {
        blob: new Blob(['png'], { type: 'image/png' }),
        naturalHeight: 100,
        naturalWidth: 200,
      },
      assets
    );

    expect(upload).not.toHaveBeenCalled();
    expect(paste?.layer.props).toMatchObject({
      alt: 'Pasted image',
      assetRef: '',
      uploading: true,
    });
    expect(getImagePastePreview(paste!.layer.id)).toMatch(/^blob:/);
    expect(nodeTransform(paste!.layer)).toMatchObject({
      x: 12,
      y: 34,
      width: 200,
      height: 100,
    });

    const assetRef = await paste!.finalizeUpload();
    expect(upload).toHaveBeenCalledOnce();
    expect(assetRef).toBe('https://cdn.example/a.png');
    expect(revoke).not.toHaveBeenCalled();

    paste!.revokePreview();
    expect(revoke).toHaveBeenCalled();
    expect(getImagePastePreview(paste!.layer.id)).toBeUndefined();
  });

  it('leaves the session preview intact when upload fails', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const assets: AssetService = {
      resolveUrl: (ref) => ref,
      upload: vi.fn().mockRejectedValue(new Error('upload failed')),
    };
    const clipboard = new InstantiationService().createInstance(
      CanvasClipboardService
    );
    const page = testArtboard({ id: 'p1', name: 'Page' }, 'absolute');
    const paste = clipboard.createImageLayerFromExternalPaste(
      page,
      { x: 0, y: 0 },
      {
        blob: new Blob(['png'], { type: 'image/png' }),
        naturalHeight: 10,
        naturalWidth: 10,
      },
      assets
    );

    await expect(paste!.finalizeUpload()).rejects.toThrow('upload failed');
    expect(revoke).not.toHaveBeenCalled();
    expect(getImagePastePreview(paste!.layer.id)).toMatch(/^blob:/);
  });

  it('returns null when AssetService has no upload', () => {
    const assets: AssetService = {
      resolveUrl: (ref) => ref,
    };
    const clipboard = new InstantiationService().createInstance(
      CanvasClipboardService
    );
    const page = testArtboard({ id: 'p1', name: 'Page' }, 'absolute');

    expect(
      clipboard.createImageLayerFromExternalPaste(
        page,
        { x: 0, y: 0 },
        {
          blob: new Blob(['png'], { type: 'image/png' }),
          naturalHeight: 10,
          naturalWidth: 10,
        },
        assets
      )
    ).toBeNull();
  });
});
