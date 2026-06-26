import { z } from 'zod';
import { ENTIDAD_ATENCION_TYPES } from '../constants/index.js';
import { objectIdSchema } from './shared.schemas.js';

export const createEntidadAtencionSchema = z.object({
  nombre: z.string().min(3).max(200),
  tipo: z.enum(Object.values(ENTIDAD_ATENCION_TYPES)),
  state: objectIdSchema,
  municipality: objectIdSchema.optional(),
  direccion: z.string().max(300).optional(),
  codigoOficial: z.string().max(32).optional(),
  autorizada: z.boolean().optional(),
});

export const listEntidadAtencionQuerySchema = z.object({
  stateId: objectIdSchema.optional(),
  municipalityId: objectIdSchema.optional(),
  autorizada: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  search: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const entidadAtencionIdParamSchema = z.object({
  id: objectIdSchema,
});
