export const MONGO_ID = '507f1f77bcf86cd799439011';
export const GEO_COUNTRY_ID = '69a2171c6997fcf9e1ceea5e';
export const GEO_STATE_ID = '69a2171c6997fcf9e1ceea61';
export const GEO_CITY_ID = '69a2171d6997fcf9e1ceea66';
export const GEO_MUNICIPALITY_ID = '69a2171d6997fcf9e1ceea70';
export const GEO_PARISH_ID = '69a2171d6997fcf9e1ceea71';
export const INSTITUTION_ID = '507f1f77bcf86cd799439012';
export const ENTIDAD_ATENCION_ID = '507f1f77bcf86cd799439013';

export const mockUbicacionInput = {
  state: GEO_STATE_ID,
  city: GEO_CITY_ID,
};

export const mockUbicacionResolved = {
  country: GEO_COUNTRY_ID,
  state: GEO_STATE_ID,
  city: GEO_CITY_ID,
};

export const mockUbicacionEnriched = {
  country: { id: GEO_COUNTRY_ID, name: 'Venezuela', code: 'VE' },
  state: { id: GEO_STATE_ID, name: 'Amazonas', iso_31662: 'VE-X' },
  city: { id: GEO_CITY_ID, name: 'Maroa' },
  municipality: null,
  parish: null,
  display: 'Maroa, Amazonas, Venezuela',
};

export const mockInstitution = {
  _id: { toString: () => INSTITUTION_ID },
  nombre: 'Protección Civil Girardot',
  tipo: 'PROTECCION_CIVIL',
  codigoOficial: 'PC-GIR-001',
  state: GEO_STATE_ID,
  municipality: GEO_MUNICIPALITY_ID,
  rolesPermitidos: ['RESCATISTA_CIVIL', 'PROTECCION_CIVIL', 'PERSONAL_MEDICO'],
  activa: true,
};

export const mockEntidadAtencion = {
  _id: { toString: () => ENTIDAD_ATENCION_ID },
  nombre: 'Refugio Municipal Los Teques',
  tipo: 'REFUGIO_OFICIAL',
  state: GEO_STATE_ID,
  municipality: GEO_MUNICIPALITY_ID,
  autorizada: true,
};

export const mockOperador = {
  id: MONGO_ID,
  nombreCompleto: 'María González',
  cedula: 'V12345678',
  telefono: '+584121234567',
  rol: 'RESCATISTA_CIVIL',
  institucion: 'Protección Civil Girardot',
  institucionId: INSTITUTION_ID,
  estadoCuenta: 'ACTIVO',
};

export const mockUserDocument = {
  _id: { toString: () => MONGO_ID },
  nombreCompleto: mockOperador.nombreCompleto,
  cedula: mockOperador.cedula,
  telefono: mockOperador.telefono,
  rol: mockOperador.rol,
  institucionId: INSTITUTION_ID,
  institucion: mockOperador.institucion,
  credencialOficialId: 'PC-AR-0045',
  estadoCuenta: 'ACTIVO',
  activo: true,
  ubicacion: mockUbicacionResolved,
};

export const mockCreateNnaPayload = {
  fotoUrl: 'https://example.com/fotos/rostro.jpg',
  datosNna: {
    nombre: 'Ana',
    sexo: 'F',
    edadAparente: 'ESCOLAR',
    rasgosIdentificativos: 'Cicatriz en frente, camiseta roja',
  },
  hallazgo: {
    fechaHora: '2026-06-26T08:30:00.000Z',
    lugarExacto: 'Av. Principal frente al hospital',
    posicionGps: {
      coordinates: [-67.6061, 10.2469],
    },
  },
  ubicacion: mockUbicacionInput,
};

export const mockNnaRecord = {
  _id: MONGO_ID,
  idUnico: 'DC-CCS-260626-001',
  statusActual: 'EN_SITIO',
  fotoUrl: mockCreateNnaPayload.fotoUrl,
  datosNna: mockCreateNnaPayload.datosNna,
  hallazgo: {
    lugarExacto: mockCreateNnaPayload.hallazgo.lugarExacto,
  },
  ubicacion: mockUbicacionResolved,
  timeline: [],
  cierreLegal: {},
};

export const mockTimelineEvent = {
  eventoId: '550e8400-e29b-41d4-a716-446655440000',
  tipoEvent: 'ATENCION_MEDICA',
  ubicacionNombre: 'Hospital Dr. Baldó',
  estadoSalud: 'ESTABLE',
  custodioResponsable: {
    nombre: 'Carlos Méndez',
    cedula: 'V87654321',
    telefono: '+584129998877',
    institucion: 'Protección Civil',
  },
};

export const mockSolicitudPayload = {
  nombreCompleto: 'María González',
  cedula: 'V12345678',
  telefono: '+584121234567',
  rolSolicitado: 'RESCATISTA_CIVIL',
  institucion: 'Protección Civil Municipio Girardot',
  fotoCedulaUrl: 'https://example.com/fotos/cedula.jpg',
  ubicacion: mockUbicacionInput,
};

export const mockRegisterPayload = {
  nombreCompleto: 'María González',
  cedula: 'V12345678',
  telefono: '+584121234567',
  rol: 'RESCATISTA_CIVIL',
  institucion: 'Protección Civil Municipio Girardot',
  credencialOficialId: 'PC-AR-0045',
  fotoCredencialUrl: 'https://example.com/fotos/credencial.jpg',
  ubicacion: mockUbicacionInput,
};
