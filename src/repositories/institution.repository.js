import Institution from '../models/Institution.js';

const institutionSelect = 'nombre tipo codigoOficial state municipality rolesPermitidos activa createdAt updatedAt';

export const institutionRepository = {
  findById: (id) => Institution.findById(id).select(institutionSelect).lean(),

  findByCodigo: (codigoOficial) =>
    Institution.findOne({ codigoOficial: codigoOficial.trim() }).select(institutionSelect).lean(),

  list: ({ stateId, municipalityId, activa, search, limit = 100 }) => {
    const filter = {};

    if (stateId) filter.state = stateId;
    if (municipalityId) filter.municipality = municipalityId;
    if (activa !== undefined) filter.activa = activa;

    if (search) {
      filter.nombre = { $regex: search, $options: 'i' };
    }

    return Institution.find(filter)
      .select(institutionSelect)
      .sort({ nombre: 1 })
      .limit(limit)
      .lean();
  },

  create: (payload) => Institution.create(payload),
};
