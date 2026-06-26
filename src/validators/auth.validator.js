import { z } from 'zod';
import {
  AUTHORITY_ROLES,
  OPERATIONAL_ROLES,
  ROLES,
} from '../constants/index.js';
import { ubicacionInputSchema } from './geo.validator.js';
import {
  cedulaSchema,
  documentoVerificacionSchema,
  objectIdSchema,
  telefonoSchema,
} from './shared.schemas.js';

export const loginSchema = z.object({
  cedula: cedulaSchema,
  credencialOficialId: z.string().min(3).max(64).optional(),
});

const fotoUrlSchema = z.string().url('Debe ser una URL válida de imagen.');

const userBaseFields = {
  nombreCompleto: z.string().min(3).max(120),
  cedula: cedulaSchema,
  telefono: telefonoSchema,
  institucionId: objectIdSchema.optional(),
  institucion: z.string().min(3).max(200).optional(),
  credencialOficialId: z.string().min(3).max(64).optional(),
  fotoCedulaUrl: fotoUrlSchema.optional(),
  fotoCredencialUrl: fotoUrlSchema.optional(),
  ubicacion: ubicacionInputSchema,
  documentosVerificacion: z.array(documentoVerificacionSchema).optional(),
};

/** Reglas de verificación de identidad al crear usuario. */
export const assertUserVerificationPhotos = (data, ctx) => {
  const credencial = data.credencialOficialId?.trim();

  if (credencial) {
    if (!data.fotoCredencialUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Si indica credencial oficial debe adjuntar fotoCredencialUrl.',
        path: ['fotoCredencialUrl'],
      });
    }
    return;
  }

  if (!data.fotoCedulaUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sin credencial oficial debe adjuntar fotoCedulaUrl junto con la cédula.',
      path: ['fotoCedulaUrl'],
    });
  }
};

const withVerificationRefine = (schema) =>
  schema.superRefine((data, ctx) => assertUserVerificationPhotos(data, ctx));

export const solicitudSchema = withVerificationRefine(
  z.object({
    ...userBaseFields,
    rolSolicitado: z.enum(OPERATIONAL_ROLES),
  }),
);

export const registerSchema = withVerificationRefine(
  z.object({
    ...userBaseFields,
    rol: z.enum(Object.values(ROLES)),
  }),
);

export const bootstrapAdminSchema = withVerificationRefine(
  z.object({
    ...userBaseFields,
    rol: z.literal(ROLES.ADMINISTRADOR),
    bootstrapSecret: z.string().min(8),
  }),
);

export const updateMeSchema = z
  .object({
    nombreCompleto: z.string().min(3).max(120).optional(),
    telefono: telefonoSchema.optional(),
    ubicacion: ubicacionInputSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
  });

export const rejectUserSchema = z.object({
  motivoRechazo: z.string().min(10).max(500),
});

export const listUsersQuerySchema = z.object({
  estadoCuenta: z.enum(['PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'RECHAZADO']).optional(),
  rol: z.enum(Object.values(ROLES)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/** Roles que solo pueden ser creados por administrador (no solicitud pública). */
export const isAuthorityRole = (rol) => AUTHORITY_ROLES.includes(rol);
