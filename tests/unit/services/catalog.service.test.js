import { describe, expect, it } from 'vitest';
import { catalogService } from '../../../src/services/catalog.service.js';
import { ALL_CATALOG_KEYS, CATALOG_KEYS } from '../../../src/constants/catalog.definitions.js';
import {
  NNA_STATUS,
  STATUS_BY_EVENT,
  TIMELINE_EVENT_TYPES,
} from '../../../src/constants/index.js';
import { AppError } from '../../../src/errors/AppError.js';

describe('catalogService', () => {
  describe('listDomains', () => {
    it('lista dominios disponibles con metadatos básicos', () => {
      const result = catalogService.listDomains();

      expect(result.count).toBe(9);
      expect(result.domains.some((d) => d.key === CATALOG_KEYS.NNA_STATUS)).toBe(true);
      expect(result.domains.find((d) => d.key === CATALOG_KEYS.NNA_STATUS)).toMatchObject({
        field: 'statusActual',
        itemCount: 4,
      });
    });

    it('incluye name e itemCount en cada dominio', () => {
      const { domains } = catalogService.listDomains();

      domains.forEach((domain) => {
        expect(domain.name).toBeTruthy();
        expect(domain.itemCount).toBeGreaterThan(0);
      });
    });
  });

  describe('getFullCatalog', () => {
    it('devuelve catálogo completo con todos los dominios', () => {
      const result = catalogService.getFullCatalog();

      expect(result.version).toBe('1.0.0');
      expect(result.domains).toHaveLength(catalogService.listDomains().count);
      expect(result.domains.map((d) => d.key)).toEqual(ALL_CATALOG_KEYS);
    });
  });

  describe('getByKey', () => {
    it('obtiene catálogo nna-status con códigos normalizados', () => {
      const catalog = catalogService.getByKey(CATALOG_KEYS.NNA_STATUS);

      expect(catalog.key).toBe('nna-status');
      expect(catalog.items.map((i) => i.code)).toEqual([
        NNA_STATUS.EN_SITIO,
        NNA_STATUS.EN_TRANSITO,
        NNA_STATUS.RESGUARDADO,
        NNA_STATUS.ENTREGADO_AUTORIDAD,
      ]);
      expect(catalog.transitions).toEqual(
        expect.arrayContaining([
          { eventType: 'TRASLADO', statusCode: NNA_STATUS.EN_TRANSITO },
          { eventType: 'ENTREGA_OFICIAL', statusCode: NNA_STATUS.ENTREGADO_AUTORIDAD },
        ]),
      );
    });

    it('obtiene timeline-events con statusMapping', () => {
      const catalog = catalogService.getByKey(CATALOG_KEYS.TIMELINE_EVENTS);

      expect(catalog.statusMapping).toEqual(STATUS_BY_EVENT);
      expect(catalog.items.map((i) => i.code)).toEqual(Object.values(TIMELINE_EVENT_TYPES));
    });

    it.each(ALL_CATALOG_KEYS)('resuelve dominio %s', (key) => {
      const catalog = catalogService.getByKey(key);

      expect(catalog.key).toBe(key);
      expect(catalog.items.length).toBeGreaterThan(0);
    });

    it('lanza AppError 404 para clave inexistente', () => {
      try {
        catalogService.getByKey('invalid-key');
        expect.unreachable('debía lanzar AppError');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toMatch(/Catálogo no encontrado/);
      }
    });
  });

  describe('getLabelMap', () => {
    it('genera mapa código → etiqueta para nna-status', () => {
      const labels = catalogService.getLabelMap(CATALOG_KEYS.NNA_STATUS);

      expect(labels).toEqual({
        EN_SITIO: 'En sitio de hallazgo',
        EN_TRANSITO: 'En tránsito',
        RESGUARDADO: 'Resguardado',
        ENTREGADO_AUTORIDAD: 'Entregado a autoridad',
      });
    });

    it('genera mapa para roles', () => {
      const labels = catalogService.getLabelMap(CATALOG_KEYS.ROLES);

      expect(labels.RESCATISTA_CIVIL).toBe('Rescatista civil');
      expect(labels.ADMINISTRADOR).toBe('Administrador');
    });
  });
});
