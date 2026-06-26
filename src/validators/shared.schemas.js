import { z } from 'zod';

/** Cédula venezolana: V/E/J + 6–9 dígitos (con o sin guion). */
export const cedulaSchema = z
  .string()
  .trim()
  .regex(/^[VEJvej]-?\d{6,9}$/, 'Cédula inválida. Formato: V12345678');

export const telefonoSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,20}$/, 'Teléfono inválido.');

export const objectIdSchema = z
  .string()
  .length(24, 'Debe ser un ObjectId válido de 24 caracteres hex.');

export const documentoVerificacionSchema = z.object({
  tipo: z.enum(['CREDENCIAL_OFICIAL', 'CARTA_INSTITUCIONAL', 'OTRO']),
  url: z.string().url(),
});
