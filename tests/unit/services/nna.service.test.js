import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../src/errors/AppError.js';
import {
  mockCreateNnaPayload,
  mockEntidadAtencion,
  mockNnaRecord,
  mockOperador,
  mockTimelineEvent,
  mockUbicacionEnriched,
  mockUbicacionInput,
  mockUbicacionResolved,
  MONGO_ID,
} from '../../fixtures/index.js';

const { nnaRepositoryMock, n8nWebhookMock, geoLocationMock, entidadMock, auditMock } = vi.hoisted(
  () => ({
    nnaRepositoryMock: {
      list: vi.fn(),
      findById: vi.fn(),
      findByOfflineFallback: vi.fn(),
      findByEventoId: vi.fn(),
      create: vi.fn(),
      pushTimelineEvent: vi.fn(),
      updateCierreLegal: vi.fn(),
      updateFotoUrl: vi.fn(),
      updateUbicacion: vi.fn(),
    },
    n8nWebhookMock: {
      dispatch: vi.fn().mockResolvedValue({ dispatched: true }),
    },
    geoLocationMock: {
      resolveUbicacionInput: vi.fn(),
      enrichUbicacion: vi.fn(),
    },
    entidadMock: {
      assertAutorizada: vi.fn(),
    },
    auditMock: {
      log: vi.fn().mockResolvedValue(undefined),
    },
  }),
);

vi.mock('../../../src/repositories/nna.repository.js', () => ({
  nnaRepository: nnaRepositoryMock,
}));

vi.mock('../../../src/services/n8nWebhook.service.js', () => ({
  n8nWebhookService: n8nWebhookMock,
}));

vi.mock('../../../src/services/geoLocation.service.js', () => ({
  geoLocationService: geoLocationMock,
}));

vi.mock('../../../src/services/entidadAtencion.service.js', () => ({
  entidadAtencionService: entidadMock,
}));

vi.mock('../../../src/services/audit.service.js', () => ({
  auditService: auditMock,
}));

const { nnaService } = await import('../../../src/services/nna.service.js');

describe('nnaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    n8nWebhookMock.dispatch.mockResolvedValue({ dispatched: true });
    geoLocationMock.resolveUbicacionInput.mockResolvedValue(mockUbicacionResolved);
    geoLocationMock.enrichUbicacion.mockImplementation(async (ubicacion) =>
      ubicacion ? mockUbicacionEnriched : null,
    );
    entidadMock.assertAutorizada.mockResolvedValue(mockEntidadAtencion);
  });

  describe('create', () => {
    it('crea registro con ubicación administrativa validada', async () => {
      nnaRepositoryMock.findByOfflineFallback.mockResolvedValue(null);
      nnaRepositoryMock.create.mockResolvedValue(mockNnaRecord);

      const result = await nnaService.create(mockCreateNnaPayload, mockOperador);

      expect(result.created).toBe(true);
      expect(geoLocationMock.resolveUbicacionInput).toHaveBeenCalledWith(mockUbicacionInput);
      expect(nnaRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ubicacion: mockUbicacionResolved,
        }),
      );
      expect(result.nna.ubicacion?.display).toContain('Venezuela');
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'NNA_REGISTRADO' }),
      );
    });

    it('persiste vozDelNna cuando se envía', async () => {
      nnaRepositoryMock.findByOfflineFallback.mockResolvedValue(null);
      nnaRepositoryMock.create.mockResolvedValue(mockNnaRecord);

      await nnaService.create(
        {
          ...mockCreateNnaPayload,
          datosNna: { ...mockCreateNnaPayload.datosNna, edadAparente: 'ADOLESCENTE' },
          vozDelNna: {
            fueEscuchado: true,
            manifestacion: 'Quiere buscar a su tía',
            nivelComprension: 'ADOLESCENTE',
          },
        },
        mockOperador,
      );

      expect(nnaRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vozDelNna: expect.objectContaining({
            manifestacion: 'Quiere buscar a su tía',
            registradoPor: mockOperador.id,
          }),
        }),
      );
    });

    it('es idempotente con idOfflineFallback', async () => {
      nnaRepositoryMock.findByOfflineFallback.mockResolvedValue(mockNnaRecord);

      const result = await nnaService.create(
        { ...mockCreateNnaPayload, idOfflineFallback: 'V12345678-1719412345678' },
        mockOperador,
      );

      expect(result.created).toBe(false);
      expect(nnaRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('rechaza coordenadas GPS inválidas', async () => {
      nnaRepositoryMock.findByOfflineFallback.mockResolvedValue(null);

      await expect(
        nnaService.create(
          {
            ...mockCreateNnaPayload,
            hallazgo: {
              ...mockCreateNnaPayload.hallazgo,
              posicionGps: { coordinates: [200, 10] },
            },
          },
          mockOperador,
        ),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('updateUbicacion', () => {
    it('actualiza ubicación del NNA', async () => {
      nnaRepositoryMock.findById.mockResolvedValue(mockNnaRecord);
      nnaRepositoryMock.updateUbicacion.mockResolvedValue(mockNnaRecord);

      const nna = await nnaService.updateUbicacion(MONGO_ID, mockUbicacionInput, mockOperador);

      expect(nnaRepositoryMock.updateUbicacion).toHaveBeenCalledWith(MONGO_ID, mockUbicacionResolved);
      expect(nna.ubicacion?.state?.name).toBe('Amazonas');
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'NNA_UBICACION' }),
      );
    });
  });

  describe('appendTimelineEvent', () => {
    it('agrega hito TRASLADO con entidad autorizada', async () => {
      nnaRepositoryMock.findById.mockResolvedValue(mockNnaRecord);
      nnaRepositoryMock.findByEventoId.mockResolvedValue(null);
      nnaRepositoryMock.pushTimelineEvent.mockResolvedValue({
        ...mockNnaRecord,
        statusActual: 'EN_TRANSITO',
      });

      const trasladoEvent = {
        ...mockTimelineEvent,
        tipoEvent: 'TRASLADO',
        entidadAtencionId: '507f1f77bcf86cd799439013',
      };

      const result = await nnaService.appendTimelineEvent(MONGO_ID, trasladoEvent, mockOperador);

      expect(result.duplicated).toBe(false);
      expect(entidadMock.assertAutorizada).toHaveBeenCalled();
      expect(nnaRepositoryMock.pushTimelineEvent).toHaveBeenCalledWith(
        MONGO_ID,
        expect.objectContaining({ nuevoStatus: 'EN_TRANSITO' }),
      );
    });

    it('rechaza TRASLADO sin entidadAtencionId', async () => {
      nnaRepositoryMock.findById.mockResolvedValue(mockNnaRecord);
      nnaRepositoryMock.findByEventoId.mockResolvedValue(null);

      await expect(
        nnaService.appendTimelineEvent(
          MONGO_ID,
          { ...mockTimelineEvent, tipoEvent: 'TRASLADO' },
          mockOperador,
        ),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('usa institución por defecto en custodio si el operador no tiene institución', async () => {
      nnaRepositoryMock.findById.mockResolvedValue(mockNnaRecord);
      nnaRepositoryMock.findByEventoId.mockResolvedValue(null);
      nnaRepositoryMock.pushTimelineEvent.mockResolvedValue(mockNnaRecord);

      await nnaService.appendTimelineEvent(
        MONGO_ID,
        {
          ...mockTimelineEvent,
          tipoEvent: 'REGISTRO_INICIAL',
          custodioResponsable: undefined,
        },
        { ...mockOperador, institucion: null },
      );

      expect(nnaRepositoryMock.pushTimelineEvent).toHaveBeenCalledWith(
        MONGO_ID,
        expect.objectContaining({
          custodioResponsable: expect.objectContaining({
            institucion: 'Sin especificar',
          }),
        }),
      );
    });
  });

  describe('registrarCierreLegal', () => {
    const cierrePayload = {
      codigoActaEntrega: 'ACTA-2026-0045',
      scannedActaUrl: 'https://example.com/acta.pdf',
      autoridadReceptora: {
        nombre: 'Ana Rodríguez',
        credencial: 'CPNNA-AR-008',
      },
    };

    it('registra cierre legal con acta', async () => {
      nnaRepositoryMock.findById.mockResolvedValue(mockNnaRecord);
      nnaRepositoryMock.findByEventoId.mockResolvedValue(null);
      nnaRepositoryMock.updateCierreLegal.mockResolvedValue({
        ...mockNnaRecord,
        statusActual: 'ENTREGADO_AUTORIDAD',
      });

      const result = await nnaService.registrarCierreLegal(
        MONGO_ID,
        cierrePayload,
        { ...mockOperador, rol: 'CONSEJERO_CPNNA' },
      );

      expect(result.duplicated).toBe(false);
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'NNA_CIERRE_LEGAL' }),
      );
    });

    it('rechaza cierre de adolescente sin vozDelNna', async () => {
      nnaRepositoryMock.findById.mockResolvedValue({
        ...mockNnaRecord,
        datosNna: { ...mockNnaRecord.datosNna, edadAparente: 'ADOLESCENTE' },
        vozDelNna: undefined,
      });

      await expect(
        nnaService.registrarCierreLegal(
          MONGO_ID,
          cierrePayload,
          { ...mockOperador, rol: 'CONSEJERO_CPNNA' },
        ),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
