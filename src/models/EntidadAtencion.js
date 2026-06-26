import mongoose from 'mongoose';
import { ENTIDAD_ATENCION_TYPES } from '../constants/index.js';

const EntidadAtencionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    tipo: {
      type: String,
      enum: Object.values(ENTIDAD_ATENCION_TYPES),
      required: true,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: true,
    },
    municipality: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
    },
    direccion: {
      type: String,
      trim: true,
    },
    codigoOficial: {
      type: String,
      trim: true,
      sparse: true,
    },
    autorizada: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

EntidadAtencionSchema.index({ state: 1, autorizada: 1 });
EntidadAtencionSchema.index({ municipality: 1, autorizada: 1 });
EntidadAtencionSchema.index({ nombre: 'text' });

const EntidadAtencion = mongoose.model('EntidadAtencion', EntidadAtencionSchema);

export default EntidadAtencion;
