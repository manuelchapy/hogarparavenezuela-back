import EntidadAtencion from '../models/EntidadAtencion.js';

const entidadSelect =
  'nombre tipo state municipality direccion codigoOficial autorizada createdAt updatedAt';

export const entidadAtencionRepository = {
  findById: (id) => EntidadAtencion.findById(id).select(entidadSelect).lean(),

  list: ({ stateId, municipalityId, autorizada, search, limit = 100 }) => {
    const filter = {};

    if (stateId) filter.state = stateId;
    if (municipalityId) filter.municipality = municipalityId;
    if (autorizada !== undefined) filter.autorizada = autorizada;

    if (search) {
      filter.nombre = { $regex: search, $options: 'i' };
    }

    return EntidadAtencion.find(filter).select(entidadSelect).sort({ nombre: 1 }).limit(limit).lean();
  },

  create: (payload) => EntidadAtencion.create(payload),
};
