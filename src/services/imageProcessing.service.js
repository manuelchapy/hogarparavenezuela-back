import sharp from 'sharp';
import { AppError } from '../errors/AppError.js';
import env from '../config/env.js';

const CONVERTIBLE_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const isConvertibleImage = (mimetype) => CONVERTIBLE_IMAGE_MIMES.has(mimetype);

/**
 * Normaliza imágenes a WebP antes de subir al bucket.
 * PDF y otros tipos se devuelven sin transformar.
 */
export const prepareFileForUpload = async (file) => {
  if (!isConvertibleImage(file.mimetype)) {
    const extension = (file.originalname.split('.').pop() || 'bin').toLowerCase();

    return {
      buffer: file.buffer,
      contentType: file.mimetype,
      extension,
      converted: false,
    };
  }

  try {
    const buffer = await sharp(file.buffer)
      .rotate()
      .webp({ quality: env.imageWebpQuality, effort: 4 })
      .toBuffer();

    return {
      buffer,
      contentType: 'image/webp',
      extension: 'webp',
      converted: true,
    };
  } catch {
    throw new AppError('No se pudo procesar la imagen. Envía JPEG, PNG o WebP válido.', 400);
  }
};
