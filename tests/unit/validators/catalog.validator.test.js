import { describe, expect, it } from 'vitest';
import { catalogKeyParamSchema } from '../../../src/validators/catalog.validator.js';
import { ALL_CATALOG_KEYS, CATALOG_KEYS } from '../../../src/constants/catalog.definitions.js';

describe('catalogKeyParamSchema', () => {
  it.each(ALL_CATALOG_KEYS)('acepta clave válida: %s', (key) => {
    const result = catalogKeyParamSchema.safeParse({ key });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.key).toBe(key);
    }
  });

  it('rechaza claves inválidas', () => {
    const invalidKeys = ['status-actual', 'EN_SITIO', '', 'nna_status', 'catalog'];

    invalidKeys.forEach((key) => {
      const result = catalogKeyParamSchema.safeParse({ key });
      expect(result.success).toBe(false);
    });
  });

  it('rechaza payload sin key', () => {
    const result = catalogKeyParamSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('acepta nna-status como ejemplo de uso en rutas', () => {
    const result = catalogKeyParamSchema.parse({ key: CATALOG_KEYS.NNA_STATUS });

    expect(result.key).toBe('nna-status');
  });
});
