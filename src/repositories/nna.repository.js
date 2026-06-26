import NnaRecord from '../models/Nna.js';

const listSelect =
  'idUnico datosNna.nombre datosNna.edadAparente statusActual fotoUrl hallazgo.lugarExacto ubicacion createdAt updatedAt';
const detailSelect =
  'idUnico idOfflineFallback statusActual fotoUrl datosNna vozDelNna hallazgo ubicacion timeline cierreLegal registradoPor createdAt updatedAt';

export const nnaRepository = {
  findByIdUnico: (idUnico) => NnaRecord.findOne({ idUnico }).select(detailSelect).lean(),

  findById: (id) => NnaRecord.findById(id).select(detailSelect).lean(),

  findByOfflineFallback: (idOfflineFallback) =>
    NnaRecord.findOne({ idOfflineFallback }).select(detailSelect).lean(),

  findByEventoId: (nnaId, eventoId) =>
    NnaRecord.findOne({ _id: nnaId, 'timeline.eventoId': eventoId })
      .select('_id timeline.eventoId')
      .lean(),

  list: ({ page = 1, limit = 20, status, stateId, cityId }) => {
    const filter = {};

    if (status) {
      filter.statusActual = status;
    }

    if (stateId) {
      filter['ubicacion.state'] = stateId;
    }

    if (cityId) {
      filter['ubicacion.city'] = cityId;
    }

    const skip = (page - 1) * limit;

    return Promise.all([
      NnaRecord.find(filter)
        .select(listSelect)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NnaRecord.countDocuments(filter),
    ]);
  },

  create: (payload) => NnaRecord.create(payload),

  updateUbicacion: (id, ubicacion) =>
    NnaRecord.findByIdAndUpdate(id, { $set: { ubicacion } }, { new: true, runValidators: true })
      .select(detailSelect)
      .lean(),

  pushTimelineEvent: (id, evento) => {
    const { nuevoStatus, ...timelineEvent } = evento;
    const update = {
      $push: { timeline: timelineEvent },
    };

    const setFields = {};

    if (evento.nuevoStatus) {
      setFields.statusActual = evento.nuevoStatus;
    }

    if (Object.keys(setFields).length > 0) {
      update.$set = setFields;
    }

    return NnaRecord.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select(detailSelect)
      .lean();
  },

  updateCierreLegal: (id, { cierreLegal, timelineEvent, nuevoStatus }) =>
    NnaRecord.findByIdAndUpdate(
      id,
      {
        $set: {
          statusActual: nuevoStatus,
          cierreLegal,
        },
        $push: { timeline: timelineEvent },
      },
      { new: true, runValidators: true },
    )
      .select(detailSelect)
      .lean(),

  updateFotoUrl: (id, fotoUrl) =>
    NnaRecord.findByIdAndUpdate(id, { $set: { fotoUrl } }, { new: true, runValidators: true })
      .select(detailSelect)
      .lean(),
};
