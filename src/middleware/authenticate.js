import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { catchAsync } from './catchAsync.js';

export const authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Token no enviado. Usa el header: Authorization: Bearer <token>', 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.sub,
      cedula: payload.cedula,
      rol: payload.rol,
      nombreCompleto: payload.nombreCompleto,
      institucion: payload.institucion,
      telefono: payload.telefono,
      estadoCuenta: payload.estadoCuenta,
    };
    return next();
  } catch {
    throw new AppError('Token inválido o expirado.', 401);
  }
});
