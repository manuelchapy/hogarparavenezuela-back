import { auditRepository } from '../repositories/audit.repository.js';

export const auditService = {
  log: async ({ entidad, entidadId, accion, actor, metadata = {}, ip }) => {
    try {
      await auditRepository.create({
        entidad,
        entidadId: String(entidadId),
        accion,
        actorUserId: actor?.id,
        actorRol: actor?.rol,
        metadata,
        ip,
      });
    } catch {
      // La auditoría no debe bloquear operaciones críticas en emergencia.
    }
  },
};
