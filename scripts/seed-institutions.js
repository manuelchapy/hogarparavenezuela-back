import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import Institution from '../src/models/Institution.js';
import EntidadAtencion from '../src/models/EntidadAtencion.js';
import { State, Municipality } from '../src/models/geo/index.js';
import { INSTITUTION_TYPES, ROLES } from '../src/constants/index.js';

const INSTITUTIONS = [
  {
    nombre: 'Protección Civil Municipio Girardot',
    tipo: INSTITUTION_TYPES.PROTECCION_CIVIL,
    codigoOficial: 'PC-GIR-001',
    rolesPermitidos: [ROLES.RESCATISTA_CIVIL, ROLES.PROTECCION_CIVIL, ROLES.PERSONAL_MEDICO],
  },
  {
    nombre: 'Consejo de Protección NNA — Estado Aragua',
    tipo: INSTITUTION_TYPES.CPNNA,
    codigoOficial: 'CPNNA-AR-001',
    rolesPermitidos: [ROLES.CONSEJERO_CPNNA],
  },
  {
    nombre: 'Hospital Central de Maracay',
    tipo: INSTITUTION_TYPES.SALUD,
    codigoOficial: 'HCM-AR-001',
    rolesPermitidos: [ROLES.PERSONAL_MEDICO],
  },
  {
    nombre: 'Brigada Voluntaria Rescate Aragua',
    tipo: INSTITUTION_TYPES.RESCATE_VOLUNTARIO,
    codigoOficial: 'RC-AR-001',
    rolesPermitidos: [ROLES.RESCATISTA_CIVIL],
  },
];

const ENTIDADES = [
  {
    nombre: 'Refugio Municipal Los Teques',
    tipo: 'REFUGIO_OFICIAL',
    direccion: 'Av. Principal, Los Teques',
    codigoOficial: 'REF-LT-001',
  },
  {
    nombre: 'Hospital Dr. José Ignacio Baldó',
    tipo: 'HOSPITAL',
    direccion: 'Maracay, Aragua',
    codigoOficial: 'HOSP-MCY-001',
  },
];

const findAraguaContext = async () => {
  const state = await State.findOne({ name: /Aragua/i }).lean();

  if (!state) {
    throw new Error('Estado Aragua no encontrado. Ejecuta primero: npm run seed:geo');
  }

  const municipality = await Municipality.findOne({
    state: state._id,
    name: /Girardot/i,
  }).lean();

  return { state, municipality };
};

const seedInstitutions = async ({ state, municipality }) => {
  let created = 0;

  for (const row of INSTITUTIONS) {
    await Institution.findOneAndUpdate(
      { codigoOficial: row.codigoOficial },
      {
        $set: {
          ...row,
          state: state._id,
          municipality: municipality?._id,
          activa: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    created += 1;
  }

  return created;
};

const seedEntidades = async ({ state, municipality }) => {
  let created = 0;

  for (const row of ENTIDADES) {
    await EntidadAtencion.findOneAndUpdate(
      { codigoOficial: row.codigoOficial },
      {
        $set: {
          ...row,
          state: state._id,
          municipality: municipality?._id,
          autorizada: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    created += 1;
  }

  return created;
};

const run = async () => {
  await connectDatabase();

  const context = await findAraguaContext();
  const institutions = await seedInstitutions(context);
  const entidades = await seedEntidades(context);

  console.log(`Instituciones seed: ${institutions}`);
  console.log(`Entidades de atención seed: ${entidades}`);
  console.log(`Estado: ${context.state.name} (${context.state._id})`);

  await disconnectDatabase();
};

run().catch(async (error) => {
  console.error(error);
  await disconnectDatabase();
  process.exit(1);
});
