import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../src/errors/AppError.js';
import { INSTITUTION_ID, mockInstitution } from '../../fixtures/index.js';

const { institutionRepositoryMock } = vi.hoisted(() => ({
  institutionRepositoryMock: {
    findById: vi.fn(),
    findByCodigo: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/institution.repository.js', () => ({
  institutionRepository: institutionRepositoryMock,
}));

const { institutionService } = await import('../../../src/services/institution.service.js');

describe('institutionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assertRoleAllowed', () => {
    it('devuelve institución si el rol está permitido', async () => {
      institutionRepositoryMock.findById.mockResolvedValue(mockInstitution);

      const result = await institutionService.assertRoleAllowed(INSTITUTION_ID, 'RESCATISTA_CIVIL');

      expect(result.nombre).toBe('Protección Civil Girardot');
    });

    it('lanza 400 si la institución no existe o está inactiva', async () => {
      institutionRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        institutionService.assertRoleAllowed(INSTITUTION_ID, 'RESCATISTA_CIVIL'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza 403 si el rol no está en rolesPermitidos', async () => {
      institutionRepositoryMock.findById.mockResolvedValue(mockInstitution);

      await expect(
        institutionService.assertRoleAllowed(INSTITUTION_ID, 'CONSEJERO_CPNNA'),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('getById', () => {
    it('lanza 404 si no existe', async () => {
      institutionRepositoryMock.findById.mockResolvedValue(null);

      await expect(institutionService.getById(INSTITUTION_ID)).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('create', () => {
    it('lanza 409 si el código oficial ya existe', async () => {
      institutionRepositoryMock.findByCodigo.mockResolvedValue(mockInstitution);

      await expect(
        institutionService.create({
          nombre: 'Otra',
          tipo: 'PROTECCION_CIVIL',
          codigoOficial: 'PC-GIR-001',
          state: INSTITUTION_ID,
          rolesPermitidos: ['RESCATISTA_CIVIL'],
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });
});
