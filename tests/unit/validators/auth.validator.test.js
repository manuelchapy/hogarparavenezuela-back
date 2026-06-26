import { describe, expect, it } from 'vitest';
import {
  bootstrapAdminSchema,
  loginSchema,
  registerSchema,
  solicitudSchema,
} from '../../../src/validators/auth.validator.js';
import { mockRegisterPayload, mockSolicitudPayload, mockUbicacionInput } from '../../fixtures/index.js';

describe('auth.validator', () => {
  describe('loginSchema', () => {
    it('acepta credenciales válidas', () => {
      const result = loginSchema.safeParse({
        cedula: 'V12345678',
        credencialOficialId: 'PC-AR-0045',
      });

      expect(result.success).toBe(true);
    });

    it('acepta login solo con cédula', () => {
      const result = loginSchema.safeParse({ cedula: 'V12345678' });
      expect(result.success).toBe(true);
    });

    it('rechaza cédula corta', () => {
      const result = loginSchema.safeParse({
        cedula: 'V123',
        credencialOficialId: 'PC-001',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('solicitudSchema', () => {
    it('acepta solicitud con foto de cédula (sin credencial)', () => {
      const result = solicitudSchema.safeParse(mockSolicitudPayload);
      expect(result.success).toBe(true);
    });

    it('acepta solicitud sin institución ni institucionId', () => {
      const { institucion: _inst, ...sinInstitucion } = mockSolicitudPayload;
      const result = solicitudSchema.safeParse(sinInstitucion);

      expect(result.success).toBe(true);
    });

    it('acepta solicitud con credencial y foto de credencial', () => {
      const { fotoCedulaUrl: _foto, ...sinFotoCedula } = mockSolicitudPayload;

      const result = solicitudSchema.safeParse({
        ...sinFotoCedula,
        credencialOficialId: 'PC-AR-0045',
        fotoCredencialUrl: 'https://example.com/credencial.jpg',
      });

      expect(result.success).toBe(true);
    });

    it('rechaza solicitud sin foto de verificación', () => {
      const result = solicitudSchema.safeParse({
        nombreCompleto: 'Test',
        cedula: 'V12345678',
        telefono: '+584121234567',
        rolSolicitado: 'RESCATISTA_CIVIL',
        ubicacion: mockUbicacionInput,
      });

      expect(result.success).toBe(false);
    });

    it('rechaza credencial sin foto de credencial', () => {
      const { fotoCedulaUrl: _foto, ...sinFotoCedula } = mockSolicitudPayload;

      const result = solicitudSchema.safeParse({
        ...sinFotoCedula,
        credencialOficialId: 'PC-AR-0045',
      });

      expect(result.success).toBe(false);
    });

    it('rechaza URL de foto inválida', () => {
      const result = solicitudSchema.safeParse({
        ...mockSolicitudPayload,
        fotoCedulaUrl: 'no-es-url',
      });

      expect(result.success).toBe(false);
    });

    it('rechaza rol de autoridad en solicitud pública', () => {
      const result = solicitudSchema.safeParse({
        ...mockSolicitudPayload,
        rolSolicitado: 'CONSEJERO_CPNNA',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('acepta registro admin con foto de credencial', () => {
      const result = registerSchema.safeParse(mockRegisterPayload);
      expect(result.success).toBe(true);
    });

    it('acepta registro con foto de cédula sin credencial', () => {
      const result = registerSchema.safeParse({
        ...mockRegisterPayload,
        credencialOficialId: undefined,
        fotoCredencialUrl: undefined,
        fotoCedulaUrl: 'https://example.com/cedula.jpg',
      });

      expect(result.success).toBe(true);
    });

    it('rechaza rol inválido', () => {
      const result = registerSchema.safeParse({
        ...mockRegisterPayload,
        rol: 'VOLUNTARIO',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('bootstrapAdminSchema', () => {
    it('acepta bootstrap con foto de credencial y secreto', () => {
      const result = bootstrapAdminSchema.safeParse({
        ...mockRegisterPayload,
        rol: 'ADMINISTRADOR',
        bootstrapSecret: 'secreto-largo-valido',
      });

      expect(result.success).toBe(true);
    });

    it('rechaza bootstrap sin foto de verificación', () => {
      const result = bootstrapAdminSchema.safeParse({
        nombreCompleto: 'Admin',
        cedula: 'V99999999',
        telefono: '+584120000000',
        rol: 'ADMINISTRADOR',
        bootstrapSecret: 'secreto-largo-valido',
        ubicacion: mockUbicacionInput,
      });

      expect(result.success).toBe(false);
    });
  });
});
