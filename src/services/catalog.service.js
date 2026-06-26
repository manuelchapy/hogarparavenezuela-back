import { AppError } from '../errors/AppError.js';
import { ALL_CATALOG_KEYS, CATALOG_DEFINITIONS } from '../constants/catalog.definitions.js';

export const catalogService = {
  listDomains: () => ({
    count: ALL_CATALOG_KEYS.length,
    domains: ALL_CATALOG_KEYS.map((key) => {
      const def = CATALOG_DEFINITIONS[key];
      return {
        key: def.key,
        name: def.name,
        field: def.field,
        itemCount: def.items.length,
      };
    }),
  }),

  getFullCatalog: () => ({
    version: '1.0.0',
    domains: ALL_CATALOG_KEYS.map((key) => CATALOG_DEFINITIONS[key]),
  }),

  getByKey: (key) => {
    const catalog = CATALOG_DEFINITIONS[key];

    if (!catalog) {
      throw new AppError(`Catálogo no encontrado: ${key}`, 404);
    }

    return catalog;
  },

  /** Mapa código → etiqueta para un dominio (útil en front). */
  getLabelMap: (key) => {
    const catalog = catalogService.getByKey(key);

    return catalog.items.reduce((acc, item) => {
      acc[item.code] = item.label;
      return acc;
    }, {});
  },
};
