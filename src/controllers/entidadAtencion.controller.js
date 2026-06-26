import { entidadAtencionService } from '../services/entidadAtencion.service.js';

export const entidadAtencionController = {
  list: async (req, res) => {
    const items = await entidadAtencionService.list(req.query);

    res.status(200).json({
      success: true,
      data: { count: items.length, items },
    });
  },

  getById: async (req, res) => {
    const entidad = await entidadAtencionService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: { entidad },
    });
  },

  create: async (req, res) => {
    const entidad = await entidadAtencionService.create(req.body);

    res.status(201).json({
      success: true,
      data: { entidad },
    });
  },
};
