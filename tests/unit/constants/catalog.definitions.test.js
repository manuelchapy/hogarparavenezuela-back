import { describe, expect, it } from 'vitest';
import {
  ALL_CATALOG_KEYS,
  CATALOG_DEFINITIONS,
  CATALOG_KEYS,
} from '../../../src/constants/catalog.definitions.js';
import {
  ACCOUNT_STATUS,
  ENTIDAD_ATENCION_TYPES,
  ESTADO_SALUD,
  INSTITUTION_TYPES,
  NNA_STATUS,
  ROLES,
  STATUS_BY_EVENT,
  TIMELINE_EVENT_TYPES,
} from '../../../src/constants/index.js';

const ITEM_SHAPE = ['code', 'label', 'description', 'order'];

describe('catalog.definitions', () => {
  it('expone 9 dominios de catálogo', () => {
    expect(ALL_CATALOG_KEYS).toHaveLength(9);
    expect(Object.keys(CATALOG_DEFINITIONS)).toHaveLength(9);
  });

  it('cada dominio tiene key, name, field e items ordenados', () => {
    for (const key of ALL_CATALOG_KEYS) {
      const catalog = CATALOG_DEFINITIONS[key];

      expect(catalog.key).toBe(key);
      expect(catalog.name).toBeTruthy();
      expect(catalog.field).toBeTruthy();
      expect(catalog.items.length).toBeGreaterThan(0);

      catalog.items.forEach((item, index) => {
        ITEM_SHAPE.forEach((prop) => expect(item).toHaveProperty(prop));
        expect(item.order).toBe(index + 1);
        expect(item.label).toBeTruthy();
      });
    }
  });

  it('nna-status incluye todos los códigos de NNA_STATUS', () => {
    const codes = CATALOG_DEFINITIONS[CATALOG_KEYS.NNA_STATUS].items.map((i) => i.code);

    expect(codes).toEqual(Object.values(NNA_STATUS));
  });

  it('nna-status documenta transiciones alineadas con STATUS_BY_EVENT', () => {
    const { transitions } = CATALOG_DEFINITIONS[CATALOG_KEYS.NNA_STATUS];

    expect(transitions).toHaveLength(Object.keys(STATUS_BY_EVENT).length);
    transitions.forEach(({ eventType, statusCode }) => {
      expect(STATUS_BY_EVENT[eventType]).toBe(statusCode);
    });
  });

  it('timeline-events expone statusMapping igual a STATUS_BY_EVENT', () => {
    expect(CATALOG_DEFINITIONS[CATALOG_KEYS.TIMELINE_EVENTS].statusMapping).toEqual(STATUS_BY_EVENT);
  });

  it('timeline-events incluye todos los tipos de evento', () => {
    const codes = CATALOG_DEFINITIONS[CATALOG_KEYS.TIMELINE_EVENTS].items.map((i) => i.code);

    expect(codes).toEqual(Object.values(TIMELINE_EVENT_TYPES));
  });

  it('roles incluye todos los roles del sistema', () => {
    const codes = CATALOG_DEFINITIONS[CATALOG_KEYS.ROLES].items.map((i) => i.code);

    expect(codes).toEqual(Object.values(ROLES));
  });

  it('account-status incluye todos los estados de cuenta', () => {
    const codes = CATALOG_DEFINITIONS[CATALOG_KEYS.ACCOUNT_STATUS].items.map((i) => i.code);

    expect(codes).toEqual(Object.values(ACCOUNT_STATUS));
  });

  it('estado-salud incluye todos los valores de ESTADO_SALUD', () => {
    const codes = CATALOG_DEFINITIONS[CATALOG_KEYS.ESTADO_SALUD].items.map((i) => i.code);

    expect(codes).toEqual(Object.values(ESTADO_SALUD));
  });

  it('institution-types y entidad-atencion-types coinciden con constantes', () => {
    const institutionCodes = CATALOG_DEFINITIONS[CATALOG_KEYS.INSTITUTION_TYPES].items.map(
      (i) => i.code,
    );
    const entidadCodes = CATALOG_DEFINITIONS[CATALOG_KEYS.ENTIDAD_ATENCION_TYPES].items.map(
      (i) => i.code,
    );

    expect(institutionCodes).toEqual(Object.values(INSTITUTION_TYPES));
    expect(entidadCodes).toEqual(Object.values(ENTIDAD_ATENCION_TYPES));
  });

  it('edad-aparente y sexo-nna tienen etiquetas en español', () => {
    const edadLabels = CATALOG_DEFINITIONS[CATALOG_KEYS.EDAD_APARENTE].items.map((i) => i.label);
    const sexoLabels = CATALOG_DEFINITIONS[CATALOG_KEYS.SEXO_NNA].items.map((i) => i.label);

    expect(edadLabels).toEqual(['Lactante', 'Preescolar', 'Escolar', 'Adolescente']);
    expect(sexoLabels).toEqual(['Femenino', 'Masculino', 'Desconocido']);
  });
});
