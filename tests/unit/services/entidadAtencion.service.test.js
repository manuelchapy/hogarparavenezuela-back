import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ENTIDAD_ATENCION_ID, mockEntidadAtencion } from '../../fixtures/index.js';

const { entidadRepositoryMock } = vi.hoisted(() => ({
  entidadRepositoryMock: {
    findById: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/entidadAtencion.repository.js', () => ({
  entidadAtencionRepository: entidadRepositoryMock,
}));

const { entidadAtencionService } = await import('../../../src/services/entidadAtencion.service.js');

describe('entidadAtencionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assertAutorizada', () => {
    it('devuelve entidad si está autorizada', async () => {
      entidadRepositoryMock.findById.mockResolvedValue(mockEntidadAtencion);

      const result = await entidadAtencionService.assertAutorizada(ENTIDAD_ATENCION_ID);

      expect(result.nombre).toBe('Refugio Municipal Los Teques');
    });

    it('lanza 403 si la entidad no está autorizada', async () => {
      entidadRepositoryMock.findById.mockResolvedValue({
        ...mockEntidadAtencion,
        autorizada: false,
      });

      await expect(
        entidadAtencionService.assertAutorizada(ENTIDAD_ATENCION_ID),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('lanza 403 si la entidad no existe', async () => {
      entidadRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        entidadAtencionService.assertAutorizada(ENTIDAD_ATENCION_ID),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
