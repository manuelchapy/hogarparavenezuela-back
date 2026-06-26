import { z } from 'zod';
import {
  ESTADO_SALUD,
  NNA_STATUS,
  TIMELINE_EVENT_TYPES,
  TIMELINE_EVENTS_REQUIRING_ENTIDAD,
} from '../constants/index.js';
import { ubicacionInputSchema } from './geo.validator.js';
import { objectIdSchema } from './shared.schemas.js';

const coordinatesSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

const custodioSchema = z.object({
  nombre: z.string().min(2).max(120),
  cedula: z.string().min(5).max(20),
  telefono: z.string().min(7).max(20),
  institucion: z.string().min(3).max(200),
});

const datosNnaSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  nombrePadres: z.string().max(200).optional(),
  sexo: z.enum(['F', 'M', 'DESCONOCIDO']),
  edadAparente: z.enum(['LACTANTE', 'PREESCOLAR', 'ESCOLAR', 'ADOLESCENTE']),
  rasgosIdentificativos: z.string().min(3).max(2000),
});

export const vozDelNnaSchema = z
  .object({
    fueEscuchado: z.boolean(),
    manifestacion: z.string().max(2000).optional(),
    nivelComprension: z.enum(['LACTANTE', 'PREESCOLAR', 'ESCOLAR', 'ADOLESCENTE']).optional(),
    justificacionNoEscucha: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fueEscuchado && !data.manifestacion?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe registrar la manifestación del NNA (Art. 80 LOPNNA).',
        path: ['manifestacion'],
      });
    }

    if (!data.fueEscuchado && !data.justificacionNoEscucha?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe justificar por qué no fue posible escuchar al NNA.',
        path: ['justificacionNoEscucha'],
      });
    }
  });

const hallazgoSchema = z.object({
  fechaHora: z.coerce.date(),
  lugarExacto: z.string().min(3).max(500),
  posicionGps: z
    .object({
      coordinates: coordinatesSchema,
    })
    .optional(),
});

const timelineEventBodySchema = z.object({
  eventoId: z.string().uuid('eventoId debe ser un UUID para idempotencia.'),
  tipoEvent: z.enum(Object.values(TIMELINE_EVENT_TYPES)),
  fechaHora: z.coerce.date().optional(),
  ubicacionNombre: z.string().min(3).max(300),
  entidadAtencionId: objectIdSchema.optional(),
  estadoSalud: z.enum(Object.values(ESTADO_SALUD)),
  custodioResponsable: custodioSchema.optional(),
  observaciones: z.string().max(2000).optional(),
  nuevoStatus: z.enum(Object.values(NNA_STATUS)).optional(),
});

const timelineWithEntidadRefine = (schema) =>
  schema.superRefine((data, ctx) => {
    if (TIMELINE_EVENTS_REQUIRING_ENTIDAD.includes(data.tipoEvent) && !data.entidadAtencionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'TRASLADO e INGRESO_REFUGIO requieren entidadAtencionId de un destino institucional autorizado.',
        path: ['entidadAtencionId'],
      });
    }
  });

export const createNnaSchema = z
  .object({
    idUnico: z
      .string()
      .regex(/^[A-Z]{2}-[A-Z0-9]+-\d{6}-\d{3}$/, 'Formato esperado: DC-CCS-260626-001')
      .optional(),
    idOfflineFallback: z
      .string()
      .regex(/^[A-Z0-9]+-\d{10,13}$/i, 'Formato esperado: CEDULA_RESCATISTA-TIMESTAMP')
      .optional(),
    fotoUrl: z.string().url(),
    datosNna: datosNnaSchema,
    vozDelNna: vozDelNnaSchema.optional(),
    hallazgo: hallazgoSchema,
    ubicacion: ubicacionInputSchema,
    eventoInicial: timelineEventBodySchema
      .omit({ eventoId: true })
      .extend({ eventoId: z.string().uuid().optional() })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.datosNna.edadAparente === 'ADOLESCENTE' && !data.vozDelNna) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'vozDelNna es obligatorio para NNA adolescentes (Art. 80 LOPNNA).',
        path: ['vozDelNna'],
      });
    }
  });

export const listNnaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(Object.values(NNA_STATUS)).optional(),
  stateId: z.string().length(24).optional(),
  cityId: z.string().length(24).optional(),
});

export const updateNnaUbicacionSchema = z.object({
  ubicacion: ubicacionInputSchema,
});

export const timelineEventSchema = timelineWithEntidadRefine(timelineEventBodySchema);

export const cierreLegalSchema = z.object({
  eventoId: z.string().uuid().optional(),
  notificadoAlCpnna: z.boolean().optional(),
  fechaHoraNotificacion: z.coerce.date().optional(),
  codigoActaEntrega: z.string().min(3).max(64),
  autoridadReceptora: z.object({
    nombre: z.string().min(2).max(120),
    credencial: z.string().min(3).max(64),
  }),
  scannedActaUrl: z.string().url(),
  archivadoPorRescatista: z.boolean().optional(),
  eventoTimeline: timelineWithEntidadRefine(timelineEventBodySchema).optional(),
});

export const nnaIdParamsSchema = z.object({
  id: z.string().length(24, 'ID de MongoDB inválido.'),
});
