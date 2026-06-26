import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

const isDuplicateKeyError = (err) => err?.code === 11000;

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos.',
      data: { errors: err.flatten() },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { data: err.details }),
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación en base de datos.',
      data: { errors: err.errors },
    });
  }

  if (isDuplicateKeyError(err)) {
    return res.status(409).json({
      success: false,
      message: 'Registro duplicado.',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Identificador inválido.',
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor.',
  });
};
