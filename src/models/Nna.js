import mongoose from 'mongoose';
import { ubicacionIndexes, ubicacionSchema } from './shared/ubicacion.schema.js';

const TimelineEventSchema = new mongoose.Schema(
  {
    eventoId: {
      type: String,
      required: true,
    },
    tipoEvent: {
      type: String,
      enum: ['REGISTRO_INICIAL', 'TRASLADO', 'ATENCION_MEDICA', 'INGRESO_REFUGIO', 'ENTREGA_OFICIAL'],
      required: true,
    },
    fechaHora: {
      type: Date,
      default: Date.now,
    },
    ubicacionNombre: {
      type: String,
      required: true,
    },
    entidadAtencionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EntidadAtencion',
    },
    estadoSalud: {
      type: String,
      enum: ['ESTABLE', 'REQUIERE_ATENCION_URGENTE', 'CON_LESIONES_VISIBLES'],
      required: true,
    },
    custodioResponsable: {
      nombre: { type: String, required: true },
      cedula: { type: String, required: true },
      telefono: { type: String, required: true },
      institucion: { type: String, required: true },
    },
    observaciones: {
      type: String,
      trim: true,
    },
  },
  { _id: true },
);

const LegalClosureSchema = new mongoose.Schema(
  {
    notificadoAlCpnna: {
      type: Boolean,
      default: false,
    },
    fechaHoraNotificacion: {
      type: Date,
    },
    codigoActaEntrega: {
      type: String,
      trim: true,
    },
    autoridadReceptora: {
      nombre: { type: String },
      credencial: { type: String },
    },
    scannedActaUrl: {
      type: String,
    },
    archivadoPorRescatista: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const VozDelNnaSchema = new mongoose.Schema(
  {
    fueEscuchado: {
      type: Boolean,
      required: true,
    },
    manifestacion: {
      type: String,
      trim: true,
    },
    nivelComprension: {
      type: String,
      enum: ['LACTANTE', 'PREESCOLAR', 'ESCOLAR', 'ADOLESCENTE'],
    },
    justificacionNoEscucha: {
      type: String,
      trim: true,
    },
    registradoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fechaHora: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const NnaRecordSchema = new mongoose.Schema(
  {
    idUnico: {
      type: String,
      unique: true,
      sparse: true,
      match: /^[A-Z]{2}-[A-Z0-9]+-\d{6}-\d{3}$/,
      index: true,
    },
    idOfflineFallback: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    statusActual: {
      type: String,
      enum: ['EN_SITIO', 'EN_TRANSITO', 'RESGUARDADO', 'ENTREGADO_AUTORIDAD'],
      default: 'EN_SITIO',
    },
    fotoUrl: {
      type: String,
      required: true,
    },
    datosNna: {
      nombre: { type: String, default: 'Desconocido/No recuerda', trim: true },
      nombrePadres: { type: String, default: 'Desconocido/No recuerda', trim: true },
      sexo: { type: String, enum: ['F', 'M', 'DESCONOCIDO'], required: true },
      edadAparente: {
        type: String,
        enum: ['LACTANTE', 'PREESCOLAR', 'ESCOLAR', 'ADOLESCENTE'],
        required: true,
      },
      rasgosIdentificativos: { type: String, required: true, trim: true },
    },
    vozDelNna: {
      type: VozDelNnaSchema,
    },
    hallazgo: {
      fechaHora: { type: Date, required: true },
      lugarExacto: { type: String, required: true },
      posicionGps: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] },
      },
    },
    ubicacion: {
      type: ubicacionSchema,
      required: true,
    },
    timeline: [TimelineEventSchema],
    cierreLegal: {
      type: LegalClosureSchema,
      default: () => ({}),
    },
    registradoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

NnaRecordSchema.index({ 'hallazgo.posicionGps': '2dsphere' });
NnaRecordSchema.index({ 'datosNna.nombre': 'text', 'datosNna.rasgosIdentificativos': 'text' });
NnaRecordSchema.index({ 'timeline.eventoId': 1 });
ubicacionIndexes.forEach((index) => NnaRecordSchema.index(index));

const NnaRecord = mongoose.model('NnaRecord', NnaRecordSchema);

export default NnaRecord;
