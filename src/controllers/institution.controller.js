import { institutionService } from '../services/institution.service.js';

export const institutionController = {
  list: async (req, res) => {
    const items = await institutionService.list(req.query);

    res.status(200).json({
      success: true,
      data: { count: items.length, items },
    });
  },

  getById: async (req, res) => {
    const institution = await institutionService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: { institution },
    });
  },

  create: async (req, res) => {
    const institution = await institutionService.create(req.body);

    res.status(201).json({
      success: true,
      data: { institution },
    });
  },
};
