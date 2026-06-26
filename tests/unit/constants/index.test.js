import { describe, expect, it } from 'vitest';
import { NNA_STATUS, ROLES_CIERRE_LEGAL, STATUS_BY_EVENT } from '../../../src/constants/index.js';

describe('constants', () => {
  it('mapea eventos de timeline a estados operativos', () => {
    expect(STATUS_BY_EVENT.TRASLADO).toBe(NNA_STATUS.EN_TRANSITO);
    expect(STATUS_BY_EVENT.INGRESO_REFUGIO).toBe(NNA_STATUS.RESGUARDADO);
    expect(STATUS_BY_EVENT.ENTREGA_OFICIAL).toBe(NNA_STATUS.ENTREGADO_AUTORIDAD);
  });

  it('define roles habilitados para cierre legal (competencia CPNNA)', () => {
    expect(ROLES_CIERRE_LEGAL).toContain('CONSEJERO_CPNNA');
    expect(ROLES_CIERRE_LEGAL).toContain('ADMINISTRADOR');
    expect(ROLES_CIERRE_LEGAL).not.toContain('PROTECCION_CIVIL');
  });
});
