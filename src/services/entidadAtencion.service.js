import { AppError } from '../errors/AppError.js';
import { entidadAtencionRepository } from '../repositories/entidadAtencion.repository.js';

const mapEntidad = (doc) =>
  doc
    ? {
        id: doc._id.toString(),
        nombre: doc.nombre,
        tipo: doc.tipo,
        state: doc.state?.toString(),
        municipality: doc.municipality?.toString() ?? null,
        direccion: doc.direccion ?? null,
        codigoOficial: doc.codigoOficial ?? null,
        autorizada: doc.autorizada,
      }
    : null;

export const entidadAtencionService = {
  list: async (query) => {
    const items = await entidadAtencionRepository.list(query);
    return items.map(mapEntidad);
  },

  getById: async (id) => {
    const doc = await entidadAtencionRepository.findById(id);

    if (!doc) {
      throw new AppError('Entidad de atención no encontrada.', 404);
    }

    return mapEntidad(doc);
  },

  create: async (payload) => {
    const doc = await entidadAtencionRepository.create(payload);
    return mapEntidad(doc.toObject());
  },

  assertAutorizada: async (entidadId) => {
    const entidad = await entidadAtencionRepository.findById(entidadId);

    if (!entidad || !entidad.autorizada) {
      throw new AppError(
        'Destino no autorizado. Solo entidades institucionales registradas (LOPNNA §3).',
        403,
      );
    }

    return entidad;
  },
};
