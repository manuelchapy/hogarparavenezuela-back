import { AppError } from '../errors/AppError.js';
import { ACCOUNT_STATUS, TIMELINE_EVENT_PERMISSIONS } from '../constants/index.js';

export const requireActiveAccount = (req, res, next) => {
  const estado = req.user?.estadoCuenta;

  if (!estado) {
    return next();
  }

  if (estado === ACCOUNT_STATUS.PENDIENTE) {
    throw new AppError('Cuenta en revisión institucional. Espera la aprobación del administrador.', 403);
  }

  if (estado === ACCOUNT_STATUS.RECHAZADO) {
    throw new AppError('Solicitud de cuenta rechazada. Contacta a tu institución.', 403);
  }

  if (estado === ACCOUNT_STATUS.SUSPENDIDO) {
    throw new AppError('Cuenta suspendida. Contacta al administrador del sistema.', 403);
  }

  if (estado !== ACCOUNT_STATUS.ACTIVO) {
    throw new AppError('Cuenta no autorizada para operar.', 403);
  }

  return next();
};

export const authorizeTimelineEvent = (req, res, next) => {
  const tipoEvent = req.body?.tipoEvent || req.body?.eventoTimeline?.tipoEvent;

  if (!tipoEvent) {
    return next();
  }

  const rolesPermitidos = TIMELINE_EVENT_PERMISSIONS[tipoEvent];

  if (!rolesPermitidos) {
    throw new AppError(`Tipo de evento no reconocido: ${tipoEvent}`, 400);
  }

  if (!rolesPermitidos.includes(req.user?.rol)) {
    throw new AppError(
      `Tu rol (${req.user?.rol}) no puede registrar el evento ${tipoEvent}.`,
      403,
    );
  }

  return next();
};
