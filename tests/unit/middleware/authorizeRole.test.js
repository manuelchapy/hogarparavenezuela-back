import { describe, expect, it, vi } from 'vitest';
import { authorizeRoles } from '../../../src/middleware/authorizeRole.js';
import { AppError } from '../../../src/errors/AppError.js';

describe('authorizeRoles', () => {
  it('permite el rol autorizado', () => {
    const next = vi.fn();
    const middleware = authorizeRoles('CONSEJERO_CPNNA', 'PROTECCION_CIVIL');

    middleware({ user: { rol: 'CONSEJERO_CPNNA' } }, {}, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('rechaza rol no permitido con 403', () => {
    const middleware = authorizeRoles('CONSEJERO_CPNNA');

    expect(() => middleware({ user: { rol: 'RESCATISTA_CIVIL' } }, {}, vi.fn())).toThrow(AppError);
    expect(() => middleware({ user: { rol: 'RESCATISTA_CIVIL' } }, {}, vi.fn())).toThrow(
      'No tienes permiso para realizar esta acción.',
    );

    try {
      middleware({ user: { rol: 'RESCATISTA_CIVIL' } }, {}, vi.fn());
    } catch (error) {
      expect(error.statusCode).toBe(403);
    }
  });

  it('rechaza petición sin usuario con 401', () => {
    const middleware = authorizeRoles('ADMINISTRADOR');

    try {
      middleware({}, {}, vi.fn());
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
    }
  });
});
