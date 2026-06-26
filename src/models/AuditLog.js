import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    entidad: {
      type: String,
      required: true,
      index: true,
    },
    entidadId: {
      type: String,
      required: true,
      index: true,
    },
    accion: {
      type: String,
      required: true,
      index: true,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actorRol: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

export default AuditLog;
