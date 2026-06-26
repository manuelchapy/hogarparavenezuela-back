import { AppError } from '../errors/AppError.js';
import { institutionRepository } from '../repositories/institution.repository.js';

const mapInstitution = (doc) =>
  doc
    ? {
        id: doc._id.toString(),
        nombre: doc.nombre,
        tipo: doc.tipo,
        codigoOficial: doc.codigoOficial,
        state: doc.state?.toString(),
        municipality: doc.municipality?.toString() ?? null,
        rolesPermitidos: doc.rolesPermitidos,
        activa: doc.activa,
      }
    : null;

export const institutionService = {
  list: async (query) => {
    const items = await institutionRepository.list(query);
    return items.map(mapInstitution);
  },

  getById: async (id) => {
    const doc = await institutionRepository.findById(id);

    if (!doc) {
      throw new AppError('Institución no encontrada.', 404);
    }

    return mapInstitution(doc);
  },

  create: async (payload) => {
    const existing = await institutionRepository.findByCodigo(payload.codigoOficial);

    if (existing) {
      throw new AppError('El código oficial de institución ya existe.', 409);
    }

    const doc = await institutionRepository.create(payload);
    return mapInstitution(doc.toObject());
  },

  assertRoleAllowed: async (institucionId, rol) => {
    const institution = await institutionRepository.findById(institucionId);

    if (!institution || !institution.activa) {
      throw new AppError('Institución no encontrada o inactiva.', 400);
    }

    if (!institution.rolesPermitidos.includes(rol)) {
      throw new AppError(
        `La institución "${institution.nombre}" no autoriza el rol ${rol}.`,
        403,
      );
    }

    return institution;
  },
};
