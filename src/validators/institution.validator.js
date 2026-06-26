import { z } from 'zod';
import { INSTITUTION_TYPES, ROLES } from '../constants/index.js';
import { objectIdSchema } from './shared.schemas.js';

export const createInstitutionSchema = z.object({
  nombre: z.string().min(3).max(200),
  tipo: z.enum(Object.values(INSTITUTION_TYPES)),
  codigoOficial: z.string().min(3).max(32),
  state: objectIdSchema,
  municipality: objectIdSchema.optional(),
  rolesPermitidos: z.array(z.enum(Object.values(ROLES))).min(1),
  activa: z.boolean().optional(),
});

export const listInstitutionQuerySchema = z.object({
  stateId: objectIdSchema.optional(),
  municipalityId: objectIdSchema.optional(),
  activa: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  search: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const institutionIdParamSchema = z.object({
  id: objectIdSchema,
});

export const objectIdParamSchema = institutionIdParamSchema;
