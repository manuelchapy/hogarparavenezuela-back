import { describe, expect, it, vi } from 'vitest';
import {
  authorizeTimelineEvent,
  requireActiveAccount,
} from '../../../src/middleware/requireActiveAccount.js';
import { AppError } from '../../../src/errors/AppError.js';

describe('requireActiveAccount', () => {
  it('permite cuenta ACTIVO', () => {
    const next = vi.fn();

    requireActiveAccount({ user: { estadoCuenta: 'ACTIVO' } }, {}, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('permite petición sin estadoCuenta en token (compatibilidad)', () => {
    const next = vi.fn();

    requireActiveAccount({ user: { rol: 'RESCATISTA_CIVIL' } }, {}, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('rechaza cuenta PENDIENTE con 403', () => {
    expect(() =>
      requireActiveAccount({ user: { estadoCuenta: 'PENDIENTE' } }, {}, vi.fn()),
    ).toThrow(AppError);

    try {
      requireActiveAccount({ user: { estadoCuenta: 'PENDIENTE' } }, {}, vi.fn());
    } catch (error) {
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('revisión institucional');
    }
  });

  it('rechaza cuenta RECHAZADO con 403', () => {
    try {
      requireActiveAccount({ user: { estadoCuenta: 'RECHAZADO' } }, {}, vi.fn());
    } catch (error) {
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('rechazada');
    }
  });

  it('rechaza cuenta SUSPENDIDO con 403', () => {
    try {
      requireActiveAccount({ user: { estadoCuenta: 'SUSPENDIDO' } }, {}, vi.fn());
    } catch (error) {
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('suspendida');
    }
  });
});

describe('authorizeTimelineEvent', () => {
  it('permite ENTREGA_OFICIAL a CONSEJERO_CPNNA', () => {
    const next = vi.fn();

    authorizeTimelineEvent(
      {
        user: { rol: 'CONSEJERO_CPNNA' },
        body: { tipoEvent: 'ENTREGA_OFICIAL' },
      },
      {},
      next,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('rechaza ENTREGA_OFICIAL a RESCATISTA_CIVIL', () => {
    try {
      authorizeTimelineEvent(
        {
          user: { rol: 'RESCATISTA_CIVIL' },
          body: { tipoEvent: 'ENTREGA_OFICIAL' },
        },
        {},
        vi.fn(),
      );
    } catch (error) {
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('ENTREGA_OFICIAL');
    }
  });

  it('lee tipoEvent desde eventoTimeline en cierre legal', () => {
    const next = vi.fn();

    authorizeTimelineEvent(
      {
        user: { rol: 'CONSEJERO_CPNNA' },
        body: {
          eventoTimeline: { tipoEvent: 'ENTREGA_OFICIAL' },
        },
      },
      {},
      next,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('rechaza tipo de evento desconocido con 400', () => {
    try {
      authorizeTimelineEvent(
        {
          user: { rol: 'ADMINISTRADOR' },
          body: { tipoEvent: 'EVENTO_FALSO' },
        },
        {},
        vi.fn(),
      );
    } catch (error) {
      expect(error.statusCode).toBe(400);
    }
  });

  it('continúa si no hay tipoEvent en body', () => {
    const next = vi.fn();

    authorizeTimelineEvent({ user: { rol: 'RESCATISTA_CIVIL' }, body: {} }, {}, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
