import multer from 'multer';
import { AppError } from '../errors/AppError.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new AppError('Tipo de archivo no permitido. Usa JPEG, PNG, WebP o PDF.', 400));
    }

    return cb(null, true);
  },
});

export const uploadSingleArchivo = upload.single('archivo');
