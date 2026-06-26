import { catalogService } from '../services/catalog.service.js';

export const catalogController = {
  index: async (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        module: 'catalog',
        routes: {
          domains: 'GET /api/catalog',
          full: 'GET /api/catalog/all',
          byKey: 'GET /api/catalog/:key',
        },
        ...catalogService.listDomains(),
      },
    });
  },

  getAll: async (req, res) => {
    res.status(200).json({
      success: true,
      data: catalogService.getFullCatalog(),
    });
  },

  getByKey: async (req, res) => {
    const catalog = catalogService.getByKey(req.params.key);

    res.status(200).json({
      success: true,
      data: { catalog },
    });
  },
};
