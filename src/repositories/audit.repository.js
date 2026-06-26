import AuditLog from '../models/AuditLog.js';

export const auditRepository = {
  create: (payload) => AuditLog.create(payload),
};
