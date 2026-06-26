import { z } from 'zod';
import { ALL_CATALOG_KEYS } from '../constants/catalog.definitions.js';

export const catalogKeyParamSchema = z.object({
  key: z.enum(ALL_CATALOG_KEYS, {
    errorMap: () => ({
      message: `Clave de catálogo inválida. Usa: ${ALL_CATALOG_KEYS.join(', ')}`,
    }),
  }),
});
