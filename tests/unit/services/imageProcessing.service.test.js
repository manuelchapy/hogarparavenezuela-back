import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import {
  isConvertibleImage,
  prepareFileForUpload,
} from '../../../src/services/imageProcessing.service.js';

const createPngBuffer = () =>
  sharp({
    create: {
      width: 32,
      height: 32,
      channels: 3,
      background: { r: 200, g: 50, b: 50 },
    },
  })
    .png()
    .toBuffer();

describe('imageProcessing.service', () => {
  it('identifica imágenes convertibles', () => {
    expect(isConvertibleImage('image/jpeg')).toBe(true);
    expect(isConvertibleImage('image/png')).toBe(true);
    expect(isConvertibleImage('image/webp')).toBe(true);
    expect(isConvertibleImage('application/pdf')).toBe(false);
  });

  it('convierte PNG a WebP', async () => {
    const buffer = await createPngBuffer();
    const file = {
      buffer,
      mimetype: 'image/png',
      originalname: 'rostro.png',
    };

    const prepared = await prepareFileForUpload(file);

    expect(prepared.converted).toBe(true);
    expect(prepared.contentType).toBe('image/webp');
    expect(prepared.extension).toBe('webp');
    expect(prepared.buffer.length).toBeGreaterThan(0);

    const metadata = await sharp(prepared.buffer).metadata();
    expect(metadata.format).toBe('webp');
  });

  it('deja PDF sin convertir', async () => {
    const file = {
      buffer: Buffer.from('%PDF-1.4 fake'),
      mimetype: 'application/pdf',
      originalname: 'acta.pdf',
    };

    const prepared = await prepareFileForUpload(file);

    expect(prepared.converted).toBe(false);
    expect(prepared.contentType).toBe('application/pdf');
    expect(prepared.extension).toBe('pdf');
  });

  it('lanza 400 si la imagen está corrupta', async () => {
    const file = {
      buffer: Buffer.from('not-an-image'),
      mimetype: 'image/jpeg',
      originalname: 'bad.jpg',
    };

    await expect(prepareFileForUpload(file)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('No se pudo procesar la imagen'),
    });
  });
});
