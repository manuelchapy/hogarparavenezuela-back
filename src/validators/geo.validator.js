import { z } from 'zod';

const objectIdSchema = z
  .string()
  .length(24, 'Debe ser un ObjectId válido de 24 caracteres hex.');

export const ubicacionInputSchema = z.object({
  country: objectIdSchema.optional(),
  state: objectIdSchema,
  city: objectIdSchema,
  municipality: objectIdSchema.optional(),
  parish: objectIdSchema.optional(),
});

export const objectIdParamSchema = z.object({
  id: objectIdSchema,
});

export const stateIdParamSchema = z.object({
  stateId: objectIdSchema,
});

export const municipalityIdParamSchema = z.object({
  municipalityId: objectIdSchema,
});

export const listGeoQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
