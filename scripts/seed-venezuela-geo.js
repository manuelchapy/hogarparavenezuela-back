import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { City, Country, Municipality, Parish, State } from '../src/models/geo/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../src/utils/venezuela.json');

const COUNTRY = {
  name: 'Venezuela',
  code: 'VE',
};

export const normalizeName = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\.$/, '')
    .replace(/\s+/g, ' ');

export const loadVenezuelaData = (filePath = DATA_PATH) => {
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

export const summarizeVenezuelaData = (rows) => {
  let municipalities = 0;
  let parishes = 0;
  let cities = 0;

  for (const row of rows) {
    municipalities += row.municipios?.length ?? 0;

    for (const municipio of row.municipios ?? []) {
      parishes += municipio.parroquias?.length ?? 0;
    }

    cities += row.ciudades?.length ?? 0;
  }

  return {
    states: rows.length,
    municipalities,
    parishes,
    citiesFromSource: cities,
  };
};

const upsertCountry = async () =>
  Country.findOneAndUpdate(
    { code: COUNTRY.code },
    { $set: COUNTRY },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

const upsertState = async (countryId, row) =>
  State.findOneAndUpdate(
    { id_estado: row.id_estado },
    {
      $set: {
        name: normalizeName(row.estado),
        country: countryId,
        iso_31662: row.iso_31662,
        capital: normalizeName(row.capital),
        id_estado: row.id_estado,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

const upsertMunicipality = async (countryId, stateId, row, municipioRow) =>
  Municipality.findOneAndUpdate(
    { state: stateId, name: normalizeName(municipioRow.municipio) },
    {
      $set: {
        name: normalizeName(municipioRow.municipio),
        state: stateId,
        country: countryId,
        capital: normalizeName(municipioRow.capital),
        id_estado: row.id_estado,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

const upsertParish = async (countryId, stateId, municipalityId, row, name) =>
  Parish.findOneAndUpdate(
    { municipality: municipalityId, name },
    {
      $set: {
        name,
        municipality: municipalityId,
        state: stateId,
        country: countryId,
        id_estado: row.id_estado,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

const upsertCity = async (countryId, stateId, row, name) =>
  City.findOneAndUpdate(
    { state: stateId, name },
    {
      $set: {
        name,
        state: stateId,
        country: countryId,
        id_estado: row.id_estado,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

export const seedVenezuelaGeo = async ({ drop = false, filePath = DATA_PATH } = {}) => {
  const rows = loadVenezuelaData(filePath);

  if (drop) {
    await Promise.all([
      Parish.deleteMany({}),
      City.deleteMany({}),
      Municipality.deleteMany({}),
      State.deleteMany({}),
      Country.deleteMany({}),
    ]);
  }

  const country = await upsertCountry();

  const counts = {
    states: 0,
    municipalities: 0,
    parishes: 0,
    cities: 0,
  };

  for (const row of rows) {
    const state = await upsertState(country._id, row);
    counts.states += 1;

    const cityNames = new Set();

    for (const ciudadName of row.ciudades ?? []) {
      const name = normalizeName(ciudadName);
      if (!name) continue;

      const key = name.toLowerCase();
      if (cityNames.has(key)) continue;

      cityNames.add(key);
      await upsertCity(country._id, state._id, row, name);
      counts.cities += 1;
    }

    for (const municipioRow of row.municipios ?? []) {
      const municipality = await upsertMunicipality(country._id, state._id, row, municipioRow);
      counts.municipalities += 1;

      const capital = normalizeName(municipioRow.capital);
      if (capital) {
        const capitalKey = capital.toLowerCase();
        if (!cityNames.has(capitalKey)) {
          cityNames.add(capitalKey);
          await upsertCity(country._id, state._id, row, capital);
          counts.cities += 1;
        }
      }

      for (const parroquiaName of municipioRow.parroquias ?? []) {
        const name = normalizeName(parroquiaName);
        if (!name) continue;

        await upsertParish(country._id, state._id, municipality._id, row, name);
        counts.parishes += 1;
      }
    }
  }

  return {
    country: country.name,
    countryId: country._id.toString(),
    counts,
    preview: summarizeVenezuelaData(rows),
  };
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const drop = process.argv.includes('--drop');

  connectDatabase()
    .then(() => seedVenezuelaGeo({ drop }))
    .then((summary) => {
      console.log('Seed geográfico de Venezuela completado.');
      console.log(JSON.stringify(summary, null, 2));
    })
    .catch((error) => {
      console.error('Error en seed geográfico:', error);
      process.exitCode = 1;
    })
    .finally(() => disconnectDatabase());
}
