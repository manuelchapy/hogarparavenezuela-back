import mongoose from 'mongoose';
import { INSTITUTION_TYPES, ROLES } from '../constants/index.js';

const InstitutionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    tipo: {
      type: String,
      enum: Object.values(INSTITUTION_TYPES),
      required: true,
    },
    codigoOficial: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
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
    rolesPermitidos: {
      type: [
        {
          type: String,
          enum: Object.values(ROLES),
        },
      ],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Debe definir al menos un rol permitido.',
      },
    },
    activa: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

InstitutionSchema.index({ state: 1, activa: 1 });
InstitutionSchema.index({ municipality: 1, activa: 1 });

const Institution = mongoose.model('Institution', InstitutionSchema);

export default Institution;
