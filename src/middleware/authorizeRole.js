import { AppError } from '../errors/AppError.js';

export const authorizeRoles =
  (...rolesPermitidos) =>
  (req, res, next) => {
    if (!req.user?.rol) {
      throw new AppError('No autorizado.', 401);
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      throw new AppError('No tienes permiso para realizar esta acción.', 403);
    }

    return next();
  };
