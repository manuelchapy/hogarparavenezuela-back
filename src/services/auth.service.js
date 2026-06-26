import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import {
  ACCOUNT_STATUS,
  AUDIT_ACTIONS,
  AUTHORITY_ROLES,
  OPERATIONAL_ROLES,
  ROLES,
} from '../constants/index.js';
import { userRepository } from '../repositories/user.repository.js';
import { geoLocationService } from './geoLocation.service.js';
import { institutionService } from './institution.service.js';
import { auditService } from './audit.service.js';

const normalizeCedula = (cedula) => cedula.trim().toUpperCase().replace(/^([VEJ])-?/i, '$1');

const sanitizeUser = async (user) => ({
  id: user._id?.toString() || user.id,
  nombreCompleto: user.nombreCompleto,
  cedula: user.cedula,
  telefono: user.telefono,
  rol: user.rol,
  institucionId: user.institucionId?.toString?.() ?? null,
  institucion: user.institucion ?? null,
  credencialOficialId: user.credencialOficialId ?? null,
  fotoCedulaUrl: user.fotoCedulaUrl ?? null,
  fotoCredencialUrl: user.fotoCredencialUrl ?? null,
  estadoCuenta: user.estadoCuenta,
  activo: user.activo,
  verificadoEn: user.verificadoEn ?? null,
  motivoRechazo: user.motivoRechazo ?? null,
  ubicacion: await geoLocationService.enrichUbicacion(user.ubicacion),
});

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      cedula: user.cedula,
      rol: user.rol,
      nombreCompleto: user.nombreCompleto,
      institucion: user.institucion ?? '',
      telefono: user.telefono,
      estadoCuenta: user.estadoCuenta,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

const resolveAccountStatus = (user) => {
  if (user.estadoCuenta) {
    return user.estadoCuenta;
  }

  return user.activo ? ACCOUNT_STATUS.ACTIVO : ACCOUNT_STATUS.PENDIENTE;
};

const assertCanLogin = (user) => {
  const estado = resolveAccountStatus(user);

  if (estado === ACCOUNT_STATUS.PENDIENTE) {
    throw new AppError(
      'Cuenta en revisión institucional. Espera la aprobación del administrador.',
      403,
    );
  }

  if (estado === ACCOUNT_STATUS.RECHAZADO) {
    throw new AppError(user.motivoRechazo || 'Solicitud de cuenta rechazada.', 403);
  }

  if (estado === ACCOUNT_STATUS.SUSPENDIDO || !user.activo) {
    throw new AppError('Usuario suspendido o inactivo.', 403);
  }

  if (estado !== ACCOUNT_STATUS.ACTIVO) {
    throw new AppError('Cuenta no autorizada para operar.', 403);
  }
};

const resolveInstitution = async (payload, rol) => {
  if (!payload.institucionId) {
    return {
      institucionId: undefined,
      institucion: payload.institucion?.trim() || undefined,
    };
  }

  const institution = await institutionService.assertRoleAllowed(payload.institucionId, rol);

  return {
    institucionId: institution._id,
    institucion: payload.institucion?.trim() || institution.nombre,
  };
};

const buildUserPayload = async (payload, rol, options = {}) => {
  const cedula = normalizeCedula(payload.cedula);
  const { institucionId, institucion } = await resolveInstitution(payload, rol);
  const ubicacion = await geoLocationService.resolveUbicacionInput(payload.ubicacion);
  const credencialOficialId = payload.credencialOficialId?.trim() || undefined;

  return {
    nombreCompleto: payload.nombreCompleto.trim(),
    cedula,
    telefono: payload.telefono.trim(),
    rol,
    ...(institucionId && { institucionId }),
    ...(institucion && { institucion }),
    ...(credencialOficialId && { credencialOficialId }),
    ...(payload.fotoCedulaUrl && { fotoCedulaUrl: payload.fotoCedulaUrl }),
    ...(payload.fotoCredencialUrl && { fotoCredencialUrl: payload.fotoCredencialUrl }),
    ubicacion,
    documentosVerificacion: payload.documentosVerificacion ?? [],
    estadoCuenta: options.estadoCuenta ?? ACCOUNT_STATUS.PENDIENTE,
    activo: options.activo ?? false,
  };
};

export const authService = {
  solicitud: async (payload, auditContext = {}) => {
    const cedula = normalizeCedula(payload.cedula);
    const existing = await userRepository.findByCedula(cedula);

    if (existing) {
      throw new AppError('La cédula ya está registrada.', 409);
    }

    if (AUTHORITY_ROLES.includes(payload.rolSolicitado)) {
      throw new AppError('Este rol solo puede ser asignado por un administrador.', 403);
    }

    if (!OPERATIONAL_ROLES.includes(payload.rolSolicitado)) {
      throw new AppError('Rol solicitado no válido para alta pública.', 400);
    }

    const userData = await buildUserPayload(payload, payload.rolSolicitado, {
      estadoCuenta: ACCOUNT_STATUS.PENDIENTE,
      activo: false,
    });

    const user = await userRepository.create(userData);

    await auditService.log({
      entidad: 'User',
      entidadId: user._id,
      accion: AUDIT_ACTIONS.USUARIO_SOLICITUD,
      actor: { id: user._id, rol: user.rol },
      metadata: { cedula: user.cedula, rol: user.rol },
      ip: auditContext.ip,
    });

    return {
      user: await sanitizeUser(user),
      message: 'Solicitud recibida. Un administrador revisará tu cuenta.',
    };
  },

  register: async (payload, adminUser, auditContext = {}) => {
    const cedula = normalizeCedula(payload.cedula);
    const existing = await userRepository.findByCedula(cedula);

    if (existing) {
      throw new AppError('La cédula ya está registrada.', 409);
    }

    const userData = await buildUserPayload(payload, payload.rol, {
      estadoCuenta: ACCOUNT_STATUS.ACTIVO,
      activo: true,
    });

    userData.verificadoPor = adminUser.id;
    userData.verificadoEn = new Date();

    const user = await userRepository.create(userData);
    const token = signToken(user);

    await auditService.log({
      entidad: 'User',
      entidadId: user._id,
      accion: AUDIT_ACTIONS.USUARIO_REGISTRO_ADMIN,
      actor: adminUser,
      metadata: { cedula: user.cedula, rol: user.rol },
      ip: auditContext.ip,
    });

    return {
      token,
      user: await sanitizeUser(user),
    };
  },

  bootstrapAdmin: async (payload, auditContext = {}) => {
    if (!env.bootstrapSecret || payload.bootstrapSecret !== env.bootstrapSecret) {
      throw new AppError('Secreto de bootstrap inválido.', 403);
    }

    const adminExists = await userRepository.findActiveAdminExists();

    if (adminExists) {
      throw new AppError('Ya existe un administrador activo. Use login.', 409);
    }

    const { bootstrapSecret: _secret, ...registerPayload } = payload;

    return authService.register(
      { ...registerPayload, rol: ROLES.ADMINISTRADOR },
      { id: null, rol: ROLES.ADMINISTRADOR },
      auditContext,
    );
  },

  login: async ({ cedula, credencialOficialId }) => {
    const user = await userRepository.findByCedula(normalizeCedula(cedula));

    if (!user) {
      throw new AppError('Credenciales incorrectas.', 401);
    }

    assertCanLogin(user);

    if (user.credencialOficialId) {
      if (!credencialOficialId || user.credencialOficialId !== credencialOficialId.trim()) {
        throw new AppError('Credenciales incorrectas.', 401);
      }
    }

    const token = signToken(user);

    return {
      token,
      user: await sanitizeUser(user),
    };
  },

  getProfile: async (userId) => {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    return sanitizeUser(user);
  },

  updateProfile: async (userId, payload) => {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    const update = {};

    if (payload.nombreCompleto !== undefined) update.nombreCompleto = payload.nombreCompleto;
    if (payload.telefono !== undefined) update.telefono = payload.telefono;

    if (payload.ubicacion) {
      update.ubicacion = await geoLocationService.resolveUbicacionInput(payload.ubicacion);
    }

    const updated = await userRepository.updateById(userId, update);

    return sanitizeUser(updated);
  },

  listUsers: async (query) => {
    const [items, total] = await userRepository.list(query);

    const users = await Promise.all(items.map((u) => sanitizeUser(u)));

    return {
      items: users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        hasNextPage: query.page * query.limit < total,
      },
    };
  },

  approveUser: async (userId, adminUser, auditContext = {}) => {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    if (user.estadoCuenta !== ACCOUNT_STATUS.PENDIENTE) {
      throw new AppError('Solo se pueden aprobar cuentas en estado PENDIENTE.', 400);
    }

    const updated = await userRepository.updateById(userId, {
      estadoCuenta: ACCOUNT_STATUS.ACTIVO,
      activo: true,
      verificadoPor: adminUser.id,
      verificadoEn: new Date(),
      motivoRechazo: null,
    });

    await auditService.log({
      entidad: 'User',
      entidadId: userId,
      accion: AUDIT_ACTIONS.USUARIO_APROBADO,
      actor: adminUser,
      metadata: { cedula: user.cedula },
      ip: auditContext.ip,
    });

    return sanitizeUser(updated);
  },

  rejectUser: async (userId, motivoRechazo, adminUser, auditContext = {}) => {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    if (user.estadoCuenta !== ACCOUNT_STATUS.PENDIENTE) {
      throw new AppError('Solo se pueden rechazar cuentas en estado PENDIENTE.', 400);
    }

    const updated = await userRepository.updateById(userId, {
      estadoCuenta: ACCOUNT_STATUS.RECHAZADO,
      activo: false,
      motivoRechazo,
      verificadoPor: adminUser.id,
      verificadoEn: new Date(),
    });

    await auditService.log({
      entidad: 'User',
      entidadId: userId,
      accion: AUDIT_ACTIONS.USUARIO_RECHAZADO,
      actor: adminUser,
      metadata: { cedula: user.cedula, motivoRechazo },
      ip: auditContext.ip,
    });

    return sanitizeUser(updated);
  },
};
