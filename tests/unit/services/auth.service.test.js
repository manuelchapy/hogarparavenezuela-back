import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { AppError } from '../../../src/errors/AppError.js';
import {
  INSTITUTION_ID,
  mockInstitution,
  mockRegisterPayload,
  mockSolicitudPayload,
  mockUbicacionEnriched,
  mockUbicacionInput,
  mockUbicacionResolved,
  mockUserDocument,
} from '../../fixtures/index.js';

const { userRepositoryMock, geoLocationMock, institutionMock, auditMock } = vi.hoisted(() => ({
  userRepositoryMock: {
    findByCedula: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    findActiveAdminExists: vi.fn(),
    list: vi.fn(),
  },
  geoLocationMock: {
    resolveUbicacionInput: vi.fn(),
    enrichUbicacion: vi.fn(),
  },
  institutionMock: {
    assertRoleAllowed: vi.fn(),
  },
  auditMock: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/repositories/user.repository.js', () => ({
  userRepository: userRepositoryMock,
}));

vi.mock('../../../src/services/geoLocation.service.js', () => ({
  geoLocationService: geoLocationMock,
}));

vi.mock('../../../src/services/institution.service.js', () => ({
  institutionService: institutionMock,
}));

vi.mock('../../../src/services/audit.service.js', () => ({
  auditService: auditMock,
}));

const { authService } = await import('../../../src/services/auth.service.js');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    geoLocationMock.resolveUbicacionInput.mockResolvedValue(mockUbicacionResolved);
    geoLocationMock.enrichUbicacion.mockResolvedValue(mockUbicacionEnriched);
    institutionMock.assertRoleAllowed.mockResolvedValue(mockInstitution);
  });

  describe('login', () => {
    it('devuelve token y usuario con credenciales correctas', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue(mockUserDocument);

      const result = await authService.login({
        cedula: 'V12345678',
        credencialOficialId: 'PC-AR-0045',
      });

      expect(result.user.cedula).toBe('V12345678');
      expect(result.user.estadoCuenta).toBe('ACTIVO');
      expect(result.token).toBeTypeOf('string');

      const payload = jwt.verify(result.token, 'test-jwt-secret');
      expect(payload.cedula).toBe('V12345678');
    });

    it('rechaza credencial incorrecta si el usuario tiene credencial', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue(mockUserDocument);

      await expect(
        authService.login({ cedula: 'V12345678', credencialOficialId: 'MALA' }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('permite login solo con cédula si el usuario no tiene credencial', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue({
        ...mockUserDocument,
        credencialOficialId: null,
      });

      const result = await authService.login({ cedula: 'V12345678' });

      expect(result.token).toBeTypeOf('string');
    });

    it('rechaza cuenta pendiente', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue({
        ...mockUserDocument,
        estadoCuenta: 'PENDIENTE',
        activo: false,
      });

      await expect(
        authService.login({ cedula: 'V12345678', credencialOficialId: 'PC-AR-0045' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('solicitud', () => {
    it('crea solicitud en estado PENDIENTE sin token', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue({
        ...mockUserDocument,
        estadoCuenta: 'PENDIENTE',
        activo: false,
        fotoCedulaUrl: mockSolicitudPayload.fotoCedulaUrl,
        credencialOficialId: undefined,
        institucionId: undefined,
      });

      const result = await authService.solicitud(mockSolicitudPayload);

      expect(result.user.estadoCuenta).toBe('PENDIENTE');
      expect(result.message).toContain('Solicitud recibida');
      expect(institutionMock.assertRoleAllowed).not.toHaveBeenCalled();
    });

    it('persiste fotoCedulaUrl al crear solicitud', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue({
        ...mockUserDocument,
        estadoCuenta: 'PENDIENTE',
        fotoCedulaUrl: mockSolicitudPayload.fotoCedulaUrl,
      });

      await authService.solicitud(mockSolicitudPayload);

      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fotoCedulaUrl: mockSolicitudPayload.fotoCedulaUrl,
          estadoCuenta: 'PENDIENTE',
          activo: false,
        }),
      );
    });

    it('valida institución del catálogo cuando se envía institucionId', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue({
        ...mockUserDocument,
        estadoCuenta: 'PENDIENTE',
        institucionId: INSTITUTION_ID,
      });

      await authService.solicitud({
        ...mockSolicitudPayload,
        institucionId: INSTITUTION_ID,
      });

      expect(institutionMock.assertRoleAllowed).toHaveBeenCalledWith(
        INSTITUTION_ID,
        'RESCATISTA_CIVIL',
      );
      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ institucionId: mockInstitution._id }),
      );
    });

    it('acepta institución como texto libre sin catálogo', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue({
        ...mockUserDocument,
        institucion: 'Brigada Voluntaria',
        estadoCuenta: 'PENDIENTE',
      });

      await authService.solicitud({
        ...mockSolicitudPayload,
        institucion: 'Brigada Voluntaria',
      });

      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ institucion: 'Brigada Voluntaria' }),
      );
      expect(institutionMock.assertRoleAllowed).not.toHaveBeenCalled();
    });

    it('lanza 409 si la cédula ya existe', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue(mockUserDocument);

      await expect(authService.solicitud(mockSolicitudPayload)).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('register', () => {
    it('crea usuario activo con token (admin)', async () => {
      userRepositoryMock.findByCedula.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue(mockUserDocument);

      const result = await authService.register(mockRegisterPayload, {
        id: 'admin-id',
        rol: 'ADMINISTRADOR',
      });

      expect(result.token).toBeTypeOf('string');
      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          estadoCuenta: 'ACTIVO',
          activo: true,
          fotoCredencialUrl: mockRegisterPayload.fotoCredencialUrl,
          credencialOficialId: 'PC-AR-0045',
        }),
      );
    });
  });

  describe('bootstrapAdmin', () => {
    it('crea admin con secreto válido', async () => {
      userRepositoryMock.findActiveAdminExists.mockResolvedValue(null);
      userRepositoryMock.findByCedula.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue({
        ...mockUserDocument,
        rol: 'ADMINISTRADOR',
      });

      const result = await authService.bootstrapAdmin({
        ...mockRegisterPayload,
        rol: 'ADMINISTRADOR',
        bootstrapSecret: 'test-bootstrap-secret',
      });

      expect(result.token).toBeTypeOf('string');
    });

    it('rechaza secreto inválido', async () => {
      await expect(
        authService.bootstrapAdmin({
          ...mockRegisterPayload,
          rol: 'ADMINISTRADOR',
          bootstrapSecret: 'secreto-mal',
        }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('rechaza si ya existe admin activo', async () => {
      userRepositoryMock.findActiveAdminExists.mockResolvedValue(true);

      await expect(
        authService.bootstrapAdmin({
          ...mockRegisterPayload,
          rol: 'ADMINISTRADOR',
          bootstrapSecret: 'test-bootstrap-secret',
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('approveUser', () => {
    it('activa cuenta PENDIENTE', async () => {
      userRepositoryMock.findById.mockResolvedValue({
        ...mockUserDocument,
        estadoCuenta: 'PENDIENTE',
        activo: false,
      });
      userRepositoryMock.updateById.mockResolvedValue({
        ...mockUserDocument,
        estadoCuenta: 'ACTIVO',
        activo: true,
      });

      const user = await authService.approveUser(
        mockUserDocument._id.toString(),
        { id: 'admin-id', rol: 'ADMINISTRADOR' },
      );

      expect(user.estadoCuenta).toBe('ACTIVO');
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'USUARIO_APROBADO' }),
      );
    });

    it('rechaza aprobar cuenta que no está PENDIENTE', async () => {
      userRepositoryMock.findById.mockResolvedValue(mockUserDocument);

      await expect(
        authService.approveUser(mockUserDocument._id.toString(), {
          id: 'admin-id',
          rol: 'ADMINISTRADOR',
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('rejectUser', () => {
    it('rechaza cuenta PENDIENTE con motivo', async () => {
      userRepositoryMock.findById.mockResolvedValue({
        ...mockUserDocument,
        estadoCuenta: 'PENDIENTE',
      });
      userRepositoryMock.updateById.mockResolvedValue({
        ...mockUserDocument,
        estadoCuenta: 'RECHAZADO',
        motivoRechazo: 'Documentación insuficiente',
      });

      const user = await authService.rejectUser(
        mockUserDocument._id.toString(),
        'Documentación insuficiente',
        { id: 'admin-id', rol: 'ADMINISTRADOR' },
      );

      expect(user.estadoCuenta).toBe('RECHAZADO');
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'USUARIO_RECHAZADO' }),
      );
    });
  });

  describe('getProfile', () => {
    it('expone fotos de verificación e institucionId nullable', async () => {
      userRepositoryMock.findById.mockResolvedValue({
        ...mockUserDocument,
        institucionId: null,
        fotoCedulaUrl: 'https://example.com/cedula.jpg',
        fotoCredencialUrl: null,
      });

      const user = await authService.getProfile(mockUserDocument._id.toString());

      expect(user.institucionId).toBeNull();
      expect(user.fotoCedulaUrl).toContain('cedula.jpg');
    });
  });

  describe('updateProfile', () => {
    it('actualiza ubicación del operador', async () => {
      userRepositoryMock.findById.mockResolvedValue(mockUserDocument);
      userRepositoryMock.updateById.mockResolvedValue(mockUserDocument);

      const user = await authService.updateProfile(mockUserDocument._id.toString(), {
        ubicacion: mockUbicacionInput,
      });

      expect(geoLocationMock.resolveUbicacionInput).toHaveBeenCalled();
      expect(user.ubicacion?.city?.name).toBe('Maroa');
    });
  });
});
