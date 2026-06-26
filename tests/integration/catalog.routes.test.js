import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { ALL_CATALOG_KEYS, CATALOG_KEYS } from '../../src/constants/catalog.definitions.js';
import { NNA_STATUS } from '../../src/constants/index.js';

describe('GET /api/catalog (integración HTTP)', () => {
  describe('GET /api/catalog', () => {
    it('responde 200 con índice de dominios sin autenticación', async () => {
      const response = await request(app).get('/api/catalog').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          module: 'catalog',
          count: 9,
          routes: {
            domains: 'GET /api/catalog',
            full: 'GET /api/catalog/all',
            byKey: 'GET /api/catalog/:key',
          },
        },
      });
      expect(response.body.data.domains).toHaveLength(9);
      expect(response.body.data.domains.some((d) => d.key === CATALOG_KEYS.NNA_STATUS)).toBe(true);
    });
  });

  describe('GET /api/catalog/all', () => {
    it('responde 200 con todos los catálogos', async () => {
      const response = await request(app).get('/api/catalog/all').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.domains).toHaveLength(9);
      expect(response.body.data.domains.map((d) => d.key)).toEqual(ALL_CATALOG_KEYS);
    });
  });

  describe('GET /api/catalog/:key', () => {
    it('responde 200 con catálogo nna-status', async () => {
      const response = await request(app).get('/api/catalog/nna-status').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.catalog).toMatchObject({
        key: 'nna-status',
        name: 'Estados operativos del NNA',
        field: 'statusActual',
      });
      expect(response.body.data.catalog.items.map((i) => i.code)).toEqual([
        NNA_STATUS.EN_SITIO,
        NNA_STATUS.EN_TRANSITO,
        NNA_STATUS.RESGUARDADO,
        NNA_STATUS.ENTREGADO_AUTORIDAD,
      ]);
      expect(response.body.data.catalog.transitions).toEqual(
        expect.arrayContaining([
          { eventType: 'TRASLADO', statusCode: NNA_STATUS.EN_TRANSITO },
        ]),
      );
    });

    it('responde 200 con catálogo timeline-events', async () => {
      const response = await request(app).get('/api/catalog/timeline-events').expect(200);

      expect(response.body.data.catalog.key).toBe('timeline-events');
      expect(response.body.data.catalog.statusMapping).toBeDefined();
      expect(response.body.data.catalog.items.length).toBeGreaterThan(0);
    });

    it.each(ALL_CATALOG_KEYS)('responde 200 para clave válida: %s', async (key) => {
      const response = await request(app).get(`/api/catalog/${key}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.catalog.key).toBe(key);
      expect(response.body.data.catalog.items.length).toBeGreaterThan(0);
    });

    it('responde 400 para clave inválida', async () => {
      const response = await request(app).get('/api/catalog/status-actual').expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Datos de entrada inválidos.',
      });
      expect(response.body.data.errors).toBeDefined();
    });

    it('responde 400 si se envía código crudo en lugar de slug', async () => {
      const response = await request(app).get('/api/catalog/EN_SITIO').expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('rutas inexistentes', () => {
    it('responde 404 para ruta fuera del módulo catalog', async () => {
      const response = await request(app).get('/api/catalog/nna-status/extra').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Ruta no encontrada/);
    });
  });
});
