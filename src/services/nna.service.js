import { randomUUID } from 'node:crypto';
import { AppError } from '../errors/AppError.js';
import {
  AUDIT_ACTIONS,
  NNA_STATUS,
  STATUS_BY_EVENT,
  TIMELINE_EVENTS_REQUIRING_ENTIDAD,
} from '../constants/index.js';
import { nnaRepository } from '../repositories/nna.repository.js';
import { n8nWebhookService } from './n8nWebhook.service.js';
import { geoLocationService } from './geoLocation.service.js';
import { entidadAtencionService } from './entidadAtencion.service.js';
import { auditService } from './audit.service.js';
import { isValidGeoJsonPoint, toGeoJsonPoint } from '../utils/geoJson.js';

const mapPosicionGps = (posicionGps) => {
  if (!posicionGps?.coordinates) {
    return undefined;
  }

  if (!isValidGeoJsonPoint(posicionGps.coordinates)) {
    throw new AppError('Coordenadas GPS inválidas. Usa [longitud, latitud] en rango válido.', 400);
  }

  return toGeoJsonPoint(posicionGps.coordinates);
};

const buildCustodioFromUser = (user) => ({
  nombre: user.nombreCompleto,
  cedula: user.cedula,
  telefono: user.telefono,
  institucion: user.institucion || 'Sin especificar',
});

const resolveStatusFromEvent = (tipoEvent, nuevoStatus) =>
  nuevoStatus || STATUS_BY_EVENT[tipoEvent] || undefined;

const assertVozDelNnaForCierre = (nna) => {
  if (nna.datosNna?.edadAparente !== 'ADOLESCENTE') {
    return;
  }

  if (!nna.vozDelNna) {
    throw new AppError(
      'No se puede cerrar legalmente: falta registro de voz del NNA adolescente (Art. 80 LOPNNA).',
      400,
    );
  }
};

const resolveEntidadAtencion = async (evento) => {
  if (!TIMELINE_EVENTS_REQUIRING_ENTIDAD.includes(evento.tipoEvent)) {
    return { entidadAtencionId: evento.entidadAtencionId, ubicacionNombre: evento.ubicacionNombre };
  }

  if (!evento.entidadAtencionId) {
    throw new AppError(
      'Debe indicar entidadAtencionId para traslados a destinos institucionales.',
      400,
    );
  }

  const entidad = await entidadAtencionService.assertAutorizada(evento.entidadAtencionId);

  return {
    entidadAtencionId: entidad._id,
    ubicacionNombre: evento.ubicacionNombre || entidad.nombre,
  };
};

const buildTimelineEvent = async (evento, user) => {
  const destino = await resolveEntidadAtencion(evento);

  return {
    eventoId: evento.eventoId,
    tipoEvent: evento.tipoEvent,
    fechaHora: evento.fechaHora || new Date(),
    ubicacionNombre: destino.ubicacionNombre,
    entidadAtencionId: destino.entidadAtencionId,
    estadoSalud: evento.estadoSalud,
    custodioResponsable: evento.custodioResponsable || buildCustodioFromUser(user),
    observaciones: evento.observaciones,
  };
};

const enrichNna = async (nna) => ({
  ...nna,
  ubicacion: await geoLocationService.enrichUbicacion(nna.ubicacion),
});

export const nnaService = {
  list: async ({ page, limit, status, stateId, cityId }) => {
    const [items, total] = await nnaRepository.list({ page, limit, status, stateId, cityId });

    const enrichedItems = await Promise.all(items.map((item) => enrichNna(item)));

    return {
      items: enrichedItems,
      pagination: {
        page,
        limit,
        total,
        hasNextPage: page * limit < total,
      },
    };
  },

  getById: async (id) => {
    const nna = await nnaRepository.findById(id);

    if (!nna) {
      throw new AppError('Registro NNA no encontrado.', 404);
    }

    return enrichNna(nna);
  },

  create: async (payload, user, auditContext = {}) => {
    if (payload.idOfflineFallback) {
      const existing = await nnaRepository.findByOfflineFallback(payload.idOfflineFallback);

      if (existing) {
        return { nna: await enrichNna(existing), created: false };
      }
    }

    const ubicacion = await geoLocationService.resolveUbicacionInput(payload.ubicacion);

    const eventoInicial = payload.eventoInicial || {
      tipoEvent: 'REGISTRO_INICIAL',
      ubicacionNombre: payload.hallazgo.lugarExacto,
      estadoSalud: 'ESTABLE',
      observaciones: 'Registro inicial del NNA en sitio de hallazgo.',
    };

    const eventoId = eventoInicial.eventoId || randomUUID();
    const timeline = [
      await buildTimelineEvent(
        {
          ...eventoInicial,
          eventoId,
          tipoEvent: eventoInicial.tipoEvent || 'REGISTRO_INICIAL',
        },
        user,
      ),
    ];

    const posicionGps = mapPosicionGps(payload.hallazgo.posicionGps);
    const hallazgo = {
      fechaHora: payload.hallazgo.fechaHora,
      lugarExacto: payload.hallazgo.lugarExacto,
      ...(posicionGps && { posicionGps }),
    };

    const vozDelNna = payload.vozDelNna
      ? {
          ...payload.vozDelNna,
          registradoPor: user.id,
          fechaHora: new Date(),
        }
      : undefined;

    const nna = await nnaRepository.create({
      idUnico: payload.idUnico,
      idOfflineFallback: payload.idOfflineFallback,
      fotoUrl: payload.fotoUrl,
      datosNna: payload.datosNna,
      vozDelNna,
      hallazgo,
      ubicacion,
      statusActual: NNA_STATUS.EN_SITIO,
      timeline,
      registradoPor: user.id,
    });

    await Promise.all([
      n8nWebhookService
        .dispatch('NNA_REGISTRADO', {
          idUnico: nna.idUnico,
          statusActual: nna.statusActual,
          datosNna: nna.datosNna,
          hallazgo: nna.hallazgo,
          ubicacion,
        })
        .catch(() => undefined),
      auditService.log({
        entidad: 'NnaRecord',
        entidadId: nna._id,
        accion: AUDIT_ACTIONS.NNA_REGISTRADO,
        actor: user,
        metadata: { idUnico: nna.idUnico, statusActual: nna.statusActual },
        ip: auditContext.ip,
      }),
    ]);

    return { nna: await enrichNna(nna), created: true };
  },

  appendTimelineEvent: async (nnaId, evento, user, auditContext = {}) => {
    const nna = await nnaRepository.findById(nnaId);

    if (!nna) {
      throw new AppError('Registro NNA no encontrado.', 404);
    }

    const duplicated = await nnaRepository.findByEventoId(nnaId, evento.eventoId);

    if (duplicated) {
      return { nna: await enrichNna(nna), duplicated: true };
    }

    const timelineEvent = await buildTimelineEvent(evento, user);
    const nuevoStatus = resolveStatusFromEvent(evento.tipoEvent, evento.nuevoStatus);

    const updated = await nnaRepository.pushTimelineEvent(nnaId, {
      ...timelineEvent,
      nuevoStatus,
    });

    await Promise.all([
      n8nWebhookService
        .dispatch('NNA_TIMELINE_ACTUALIZADO', {
          idUnico: updated.idUnico,
          eventoId: evento.eventoId,
          tipoEvent: evento.tipoEvent,
          statusActual: updated.statusActual,
        })
        .catch(() => undefined),
      auditService.log({
        entidad: 'NnaRecord',
        entidadId: nnaId,
        accion: AUDIT_ACTIONS.NNA_TIMELINE,
        actor: user,
        metadata: { eventoId: evento.eventoId, tipoEvent: evento.tipoEvent },
        ip: auditContext.ip,
      }),
    ]);

    return { nna: await enrichNna(updated), duplicated: false };
  },

  registrarCierreLegal: async (nnaId, payload, user, auditContext = {}) => {
    const nna = await nnaRepository.findById(nnaId);

    if (!nna) {
      throw new AppError('Registro NNA no encontrado.', 404);
    }

    assertVozDelNnaForCierre(nna);

    if (nna.statusActual === NNA_STATUS.ENTREGADO_AUTORIDAD) {
      return { nna: await enrichNna(nna), duplicated: true };
    }

    const eventoId = payload.eventoId || randomUUID();
    const duplicated = await nnaRepository.findByEventoId(nnaId, eventoId);

    if (duplicated) {
      return { nna: await enrichNna(nna), duplicated: true };
    }

    const eventoTimeline = payload.eventoTimeline
      ? await buildTimelineEvent(
          { ...payload.eventoTimeline, eventoId, tipoEvent: 'ENTREGA_OFICIAL' },
          user,
        )
      : await buildTimelineEvent(
          {
            eventoId,
            tipoEvent: 'ENTREGA_OFICIAL',
            ubicacionNombre: 'Entrega ante Consejo de Protección competente',
            estadoSalud: 'ESTABLE',
            observaciones: `Acta ${payload.codigoActaEntrega} — entrega formal CPNNA.`,
          },
          user,
        );

    const cierreLegal = {
      notificadoAlCpnna: payload.notificadoAlCpnna ?? true,
      fechaHoraNotificacion: payload.fechaHoraNotificacion || new Date(),
      codigoActaEntrega: payload.codigoActaEntrega,
      autoridadReceptora: payload.autoridadReceptora,
      scannedActaUrl: payload.scannedActaUrl,
      archivadoPorRescatista: payload.archivadoPorRescatista ?? false,
    };

    const updated = await nnaRepository.updateCierreLegal(nnaId, {
      cierreLegal,
      timelineEvent: eventoTimeline,
      nuevoStatus: NNA_STATUS.ENTREGADO_AUTORIDAD,
    });

    await Promise.all([
      n8nWebhookService
        .dispatch('NNA_CIERRE_LEGAL', {
          idUnico: updated.idUnico,
          codigoActaEntrega: payload.codigoActaEntrega,
          scannedActaUrl: payload.scannedActaUrl,
        })
        .catch(() => undefined),
      auditService.log({
        entidad: 'NnaRecord',
        entidadId: nnaId,
        accion: AUDIT_ACTIONS.NNA_CIERRE_LEGAL,
        actor: user,
        metadata: {
          codigoActaEntrega: payload.codigoActaEntrega,
          autoridadReceptora: payload.autoridadReceptora,
        },
        ip: auditContext.ip,
      }),
    ]);

    return { nna: await enrichNna(updated), duplicated: false };
  },

  updateUbicacion: async (nnaId, ubicacionInput, user, auditContext = {}) => {
    const nna = await nnaRepository.findById(nnaId);

    if (!nna) {
      throw new AppError('Registro NNA no encontrado.', 404);
    }

    const ubicacion = await geoLocationService.resolveUbicacionInput(ubicacionInput);
    const updated = await nnaRepository.updateUbicacion(nnaId, ubicacion);

    await auditService.log({
      entidad: 'NnaRecord',
      entidadId: nnaId,
      accion: AUDIT_ACTIONS.NNA_UBICACION,
      actor: user,
      metadata: { ubicacion },
      ip: auditContext.ip,
    });

    return enrichNna(updated);
  },

  updateFotoUrl: async (nnaId, fotoUrl) => {
    const nna = await nnaRepository.findById(nnaId);

    if (!nna) {
      throw new AppError('Registro NNA no encontrado.', 404);
    }

    return enrichNna(await nnaRepository.updateFotoUrl(nnaId, fotoUrl));
  },
};
