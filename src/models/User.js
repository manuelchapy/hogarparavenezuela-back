import mongoose from 'mongoose';
import { ACCOUNT_STATUS, ROLES } from '../constants/index.js';
import { ubicacionIndexes, ubicacionSchema } from './shared/ubicacion.schema.js';

const DocumentoVerificacionSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ['CREDENCIAL_OFICIAL', 'CARTA_INSTITUCIONAL', 'CEDULA', 'OTRO'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    subidoEn: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    nombreCompleto: {
      type: String,
      required: true,
      trim: true,
    },
    cedula: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    telefono: {
      type: String,
      required: true,
    },
    rol: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    institucionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
    },
    institucion: {
      type: String,
      trim: true,
    },
    credencialOficialId: {
      type: String,
      trim: true,
    },
    fotoCedulaUrl: {
      type: String,
      trim: true,
    },
    fotoCredencialUrl: {
      type: String,
      trim: true,
    },
    ubicacion: {
      type: ubicacionSchema,
      required: true,
    },
    estadoCuenta: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.PENDIENTE,
    },
    activo: {
      type: Boolean,
      default: false,
    },
    verificadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verificadoEn: {
      type: Date,
    },
    motivoRechazo: {
      type: String,
      trim: true,
    },
    documentosVerificacion: {
      type: [DocumentoVerificacionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ estadoCuenta: 1, createdAt: -1 });
ubicacionIndexes.forEach((index) => UserSchema.index(index));

const User = mongoose.model('User', UserSchema);

export default User;
