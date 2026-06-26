import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogController } from '../../../src/controllers/catalog.controller.js';
import { CATALOG_KEYS } from '../../../src/constants/catalog.definitions.js';

const createMockRes = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return res;
};

describe('catalogController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('index', () => {
    it('responde 200 con índice de dominios y rutas', async () => {
      const res = createMockRes();

      await catalogController.index({}, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.module).toBe('catalog');
      expect(res.body.data.routes).toMatchObject({
        domains: 'GET /api/catalog',
        full: 'GET /api/catalog/all',
        byKey: 'GET /api/catalog/:key',
      });
      expect(res.body.data.count).toBe(9);
      expect(res.body.data.domains.some((d) => d.key === CATALOG_KEYS.NNA_STATUS)).toBe(true);
    });
  });

  describe('getAll', () => {
    it('responde 200 con catálogo completo', async () => {
      const res = createMockRes();

      await catalogController.getAll({}, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe('1.0.0');
      expect(res.body.data.domains).toHaveLength(9);
    });
  });

  describe('getByKey', () => {
    it('responde 200 con catálogo solicitado', async () => {
      const res = createMockRes();
      const req = { params: { key: CATALOG_KEYS.NNA_STATUS } };

      await catalogController.getByKey(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.catalog.key).toBe('nna-status');
      expect(res.body.data.catalog.field).toBe('statusActual');
      expect(res.body.data.catalog.items).toHaveLength(4);
    });

    it('propaga error 404 si la clave no existe', async () => {
      const req = { params: { key: 'no-existe' } };

      await expect(catalogController.getByKey(req, createMockRes())).rejects.toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('Catálogo no encontrado'),
      });
    });
  });
});
