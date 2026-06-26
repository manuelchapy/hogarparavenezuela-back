import {
  ACCOUNT_STATUS,
  ENTIDAD_ATENCION_TYPES,
  ESTADO_SALUD,
  INSTITUTION_TYPES,
  NNA_STATUS,
  ROLES,
  STATUS_BY_EVENT,
  TIMELINE_EVENT_TYPES,
} from './index.js';

/** Convierte SNAKE_CASE a etiqueta legible por defecto. */
const toDefaultLabel = (code) =>
  code
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

/**
 * @param {Record<string, string>} enumObject
 * @param {Record<string, Partial<{ label: string, description: string, order: number }>>} [meta]
 */
const buildCatalogItems = (enumObject, meta = {}) =>
  Object.values(enumObject)
    .map((code, index) => ({
      code,
      label: meta[code]?.label ?? toDefaultLabel(code),
      description: meta[code]?.description ?? null,
      order: meta[code]?.order ?? index + 1,
    }))
    .sort((a, b) => a.order - b.order);

export const CATALOG_KEYS = {
  NNA_STATUS: 'nna-status',
  TIMELINE_EVENTS: 'timeline-events',
  ESTADO_SALUD: 'estado-salud',
  ROLES: 'roles',
  ACCOUNT_STATUS: 'account-status',
  INSTITUTION_TYPES: 'institution-types',
  ENTIDAD_ATENCION_TYPES: 'entidad-atencion-types',
  EDAD_APARENTE: 'edad-aparente',
  SEXO_NNA: 'sexo-nna',
};

const NNA_STATUS_META = {
  [NNA_STATUS.EN_SITIO]: {
    label: 'En sitio de hallazgo',
    description: 'NNA registrado en el lugar del rescate. Estado inicial tras el alta.',
    order: 1,
  },
  [NNA_STATUS.EN_TRANSITO]: {
    label: 'En tránsito',
    description: 'NNA en movimiento hacia un destino institucional autorizado.',
    order: 2,
  },
  [NNA_STATUS.RESGUARDADO]: {
    label: 'Resguardado',
    description: 'NNA en refugio o entidad de atención oficial.',
    order: 3,
  },
  [NNA_STATUS.ENTREGADO_AUTORIDAD]: {
    label: 'Entregado a autoridad',
    description: 'Cierre legal completado ante CPNNA u autoridad competente.',
    order: 4,
  },
};

const TIMELINE_EVENT_META = {
  [TIMELINE_EVENT_TYPES.REGISTRO_INICIAL]: {
    label: 'Registro inicial',
    description: 'Primer hito al documentar el hallazgo del NNA.',
    order: 1,
  },
  [TIMELINE_EVENT_TYPES.TRASLADO]: {
    label: 'Traslado',
    description: 'Movimiento hacia entidad institucional. Actualiza status a EN_TRANSITO.',
    order: 2,
  },
  [TIMELINE_EVENT_TYPES.ATENCION_MEDICA]: {
    label: 'Atención médica',
    description: 'Hito de valoración o atención de salud en campo o punto médico.',
    order: 3,
  },
  [TIMELINE_EVENT_TYPES.INGRESO_REFUGIO]: {
    label: 'Ingreso a refugio',
    description: 'Ingreso a refugio oficial. Actualiza status a RESGUARDADO.',
    order: 4,
  },
  [TIMELINE_EVENT_TYPES.ENTREGA_OFICIAL]: {
    label: 'Entrega oficial',
    description: 'Entrega ante CPNNA. Actualiza status a ENTREGADO_AUTORIDAD.',
    order: 5,
  },
};

const ESTADO_SALUD_META = {
  [ESTADO_SALUD.ESTABLE]: {
    label: 'Estable',
    description: 'Sin signos de urgencia inmediata.',
    order: 1,
  },
  [ESTADO_SALUD.REQUIERE_ATENCION_URGENTE]: {
    label: 'Requiere atención urgente',
    description: 'Necesita atención médica prioritaria.',
    order: 2,
  },
  [ESTADO_SALUD.CON_LESIONES_VISIBLES]: {
    label: 'Con lesiones visibles',
    description: 'Presenta lesiones aparentes que deben documentarse.',
    order: 3,
  },
};

const ROLES_META = {
  [ROLES.RESCATISTA_CIVIL]: {
    label: 'Rescatista civil',
    description: 'Operador de campo. Registro NNA y timeline operativo.',
    order: 1,
  },
  [ROLES.PROTECCION_CIVIL]: {
    label: 'Protección Civil',
    description: 'Operador institucional. Traslados e ingreso a refugio.',
    order: 2,
  },
  [ROLES.PERSONAL_MEDICO]: {
    label: 'Personal médico',
    description: 'Atención médica en timeline.',
    order: 3,
  },
  [ROLES.CONSEJERO_CPNNA]: {
    label: 'Consejero CPNNA',
    description: 'Competencia de cierre legal y entrega oficial (LOPNNA).',
    order: 4,
  },
  [ROLES.ADMINISTRADOR]: {
    label: 'Administrador',
    description: 'Gestión de usuarios, catálogos y operación completa.',
    order: 5,
  },
};

export const CATALOG_DEFINITIONS = {
  [CATALOG_KEYS.NNA_STATUS]: {
    key: CATALOG_KEYS.NNA_STATUS,
    name: 'Estados operativos del NNA',
    field: 'statusActual',
    items: buildCatalogItems(NNA_STATUS, NNA_STATUS_META),
    transitions: Object.entries(STATUS_BY_EVENT).map(([eventType, statusCode]) => ({
      eventType,
      statusCode,
    })),
  },
  [CATALOG_KEYS.TIMELINE_EVENTS]: {
    key: CATALOG_KEYS.TIMELINE_EVENTS,
    name: 'Tipos de evento en timeline',
    field: 'timeline.tipoEvent',
    items: buildCatalogItems(TIMELINE_EVENT_TYPES, TIMELINE_EVENT_META),
    statusMapping: STATUS_BY_EVENT,
  },
  [CATALOG_KEYS.ESTADO_SALUD]: {
    key: CATALOG_KEYS.ESTADO_SALUD,
    name: 'Estado de salud aparente',
    field: 'timeline.estadoSalud',
    items: buildCatalogItems(ESTADO_SALUD, ESTADO_SALUD_META),
  },
  [CATALOG_KEYS.ROLES]: {
    key: CATALOG_KEYS.ROLES,
    name: 'Roles de operadores',
    field: 'user.rol',
    items: buildCatalogItems(ROLES, ROLES_META),
  },
  [CATALOG_KEYS.ACCOUNT_STATUS]: {
    key: CATALOG_KEYS.ACCOUNT_STATUS,
    name: 'Estados de cuenta de usuario',
    field: 'user.estadoCuenta',
    items: buildCatalogItems(ACCOUNT_STATUS, {
      [ACCOUNT_STATUS.PENDIENTE]: {
        label: 'Pendiente de revisión',
        description: 'Solicitud enviada, espera aprobación del administrador.',
        order: 1,
      },
      [ACCOUNT_STATUS.ACTIVO]: {
        label: 'Activo',
        description: 'Cuenta aprobada. Puede operar en la plataforma.',
        order: 2,
      },
      [ACCOUNT_STATUS.SUSPENDIDO]: {
        label: 'Suspendido',
        description: 'Acceso bloqueado por el administrador.',
        order: 3,
      },
      [ACCOUNT_STATUS.RECHAZADO]: {
        label: 'Rechazado',
        description: 'Solicitud rechazada. Debe volver a registrarse.',
        order: 4,
      },
    }),
  },
  [CATALOG_KEYS.INSTITUTION_TYPES]: {
    key: CATALOG_KEYS.INSTITUTION_TYPES,
    name: 'Tipos de institución',
    field: 'institution.tipo',
    items: buildCatalogItems(INSTITUTION_TYPES),
  },
  [CATALOG_KEYS.ENTIDAD_ATENCION_TYPES]: {
    key: CATALOG_KEYS.ENTIDAD_ATENCION_TYPES,
    name: 'Tipos de entidad de atención',
    field: 'entidadAtencion.tipo',
    items: buildCatalogItems(ENTIDAD_ATENCION_TYPES),
  },
  [CATALOG_KEYS.EDAD_APARENTE]: {
    key: CATALOG_KEYS.EDAD_APARENTE,
    name: 'Edad aparente del NNA',
    field: 'datosNna.edadAparente',
    items: buildCatalogItems(
      {
        LACTANTE: 'LACTANTE',
        PREESCOLAR: 'PREESCOLAR',
        ESCOLAR: 'ESCOLAR',
        ADOLESCENTE: 'ADOLESCENTE',
      },
      {
        LACTANTE: { label: 'Lactante', order: 1 },
        PREESCOLAR: { label: 'Preescolar', order: 2 },
        ESCOLAR: { label: 'Escolar', order: 3 },
        ADOLESCENTE: { label: 'Adolescente', order: 4 },
      },
    ),
  },
  [CATALOG_KEYS.SEXO_NNA]: {
    key: CATALOG_KEYS.SEXO_NNA,
    name: 'Sexo del NNA',
    field: 'datosNna.sexo',
    items: buildCatalogItems(
      { F: 'F', M: 'M', DESCONOCIDO: 'DESCONOCIDO' },
      {
        F: { label: 'Femenino', order: 1 },
        M: { label: 'Masculino', order: 2 },
        DESCONOCIDO: { label: 'Desconocido', order: 3 },
      },
    ),
  },
};

export const ALL_CATALOG_KEYS = Object.values(CATALOG_KEYS);
