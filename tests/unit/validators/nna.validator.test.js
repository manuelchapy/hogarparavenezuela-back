import { describe, expect, it } from 'vitest';
import {
  cierreLegalSchema,
  createNnaSchema,
  listNnaQuerySchema,
  nnaIdParamsSchema,
  timelineEventSchema,
} from '../../../src/validators/nna.validator.js';
import { mockCreateNnaPayload, mockTimelineEvent, MONGO_ID } from '../../fixtures/index.js';

describe('nna.validator', () => {
  describe('createNnaSchema', () => {
    it('acepta payload válido de registro', () => {
      const result = createNnaSchema.safeParse({
        ...mockCreateNnaPayload,
        idUnico: 'DC-CCS-260626-001',
        idOfflineFallback: 'V12345678-1719412345678',
      });

      expect(result.success).toBe(true);
    });

    it('exige vozDelNna para NNA adolescente', () => {
      const result = createNnaSchema.safeParse({
        ...mockCreateNnaPayload,
        datosNna: { ...mockCreateNnaPayload.datosNna, edadAparente: 'ADOLESCENTE' },
      });

      expect(result.success).toBe(false);
    });

    it('acepta adolescente con vozDelNna', () => {
      const result = createNnaSchema.safeParse({
        ...mockCreateNnaPayload,
        datosNna: { ...mockCreateNnaPayload.datosNna, edadAparente: 'ADOLESCENTE' },
        vozDelNna: {
          fueEscuchado: true,
          manifestacion: 'Desea contactar a su madre',
          nivelComprension: 'ADOLESCENTE',
        },
      });

      expect(result.success).toBe(true);
    });

    it('rechaza fotoUrl inválida', () => {
      const result = createNnaSchema.safeParse({
        ...mockCreateNnaPayload,
        fotoUrl: 'no-es-url',
      });

      expect(result.success).toBe(false);
    });

    it('rechaza idUnico con formato incorrecto', () => {
      const result = createNnaSchema.safeParse({
        ...mockCreateNnaPayload,
        idUnico: 'NNA-123',
      });

      expect(result.success).toBe(false);
    });

    it('rechaza coordenadas GPS fuera de rango', () => {
      const result = createNnaSchema.safeParse({
        ...mockCreateNnaPayload,
        hallazgo: {
          ...mockCreateNnaPayload.hallazgo,
          posicionGps: { coordinates: [200, 10] },
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('timelineEventSchema', () => {
    it('exige eventoId UUID para idempotencia', () => {
      const valid = timelineEventSchema.safeParse(mockTimelineEvent);
      const invalid = timelineEventSchema.safeParse({
        ...mockTimelineEvent,
        eventoId: 'no-uuid',
      });

      expect(valid.success).toBe(true);
      expect(invalid.success).toBe(false);
    });

    it('exige entidadAtencionId en TRASLADO', () => {
      const result = timelineEventSchema.safeParse({
        ...mockTimelineEvent,
        tipoEvent: 'TRASLADO',
      });

      expect(result.success).toBe(false);
    });

    it('acepta TRASLADO con entidadAtencionId', () => {
      const result = timelineEventSchema.safeParse({
        ...mockTimelineEvent,
        tipoEvent: 'TRASLADO',
        entidadAtencionId: '507f1f77bcf86cd799439013',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('listNnaQuerySchema', () => {
    it('aplica defaults de paginación', () => {
      const result = listNnaQuerySchema.parse({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('acepta filtro por status', () => {
      const result = listNnaQuerySchema.safeParse({ status: 'EN_TRANSITO' });
      expect(result.success).toBe(true);
    });
  });

  describe('nnaIdParamsSchema', () => {
    it('valida ObjectId de 24 caracteres', () => {
      expect(nnaIdParamsSchema.safeParse({ id: MONGO_ID }).success).toBe(true);
      expect(nnaIdParamsSchema.safeParse({ id: 'corto' }).success).toBe(false);
    });
  });

  describe('cierreLegalSchema', () => {
    it('acepta cierre legal con acta y autoridad receptora obligatorias', () => {
      const result = cierreLegalSchema.safeParse({
        codigoActaEntrega: 'ACTA-2026-0045',
        scannedActaUrl: 'https://example.com/acta.pdf',
        autoridadReceptora: {
          nombre: 'Ana Rodríguez',
          credencial: 'CPNNA-AR-008',
        },
      });

      expect(result.success).toBe(true);
    });

    it('rechaza cierre legal sin acta escaneada', () => {
      const result = cierreLegalSchema.safeParse({
        codigoActaEntrega: 'ACTA-2026-0045',
        autoridadReceptora: {
          nombre: 'Ana Rodríguez',
          credencial: 'CPNNA-AR-008',
        },
      });

      expect(result.success).toBe(false);
    });
  });
});
