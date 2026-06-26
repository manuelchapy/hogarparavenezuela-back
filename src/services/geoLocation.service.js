import { AppError } from '../errors/AppError.js';
import { DEFAULT_COUNTRY_CODE } from '../constants/geo.js';
import { geoRepository } from '../repositories/geo.repository.js';

export const geoLocationService = {
  getDefaultCountry: async () => {
    const country = await geoRepository.findCountryByCode(DEFAULT_COUNTRY_CODE);

    if (!country) {
      throw new AppError(
        'Catálogo geográfico no inicializado. Ejecute npm run seed:geo.',
        503,
      );
    }

    return country;
  },

  resolveUbicacionInput: async (input) => {
    const country = input.country
      ? await geoRepository.findCountryById(input.country)
      : await geoLocationService.getDefaultCountry();

    if (!country) {
      throw new AppError('País no válido.', 400);
    }

    const state = await geoRepository.findStateById(input.state);

    if (!state || state.country.toString() !== country._id.toString()) {
      throw new AppError('El estado no pertenece al país indicado.', 400);
    }

    const city = await geoRepository.findCityById(input.city);

    if (!city || city.state.toString() !== state._id.toString()) {
      throw new AppError('La ciudad no pertenece al estado indicado.', 400);
    }

    let municipality = null;
    let parish = null;

    if (input.municipality) {
      municipality = await geoRepository.findMunicipalityById(input.municipality);

      if (!municipality || municipality.state.toString() !== state._id.toString()) {
        throw new AppError('El municipio no pertenece al estado indicado.', 400);
      }
    }

    if (input.parish) {
      if (!input.municipality) {
        throw new AppError('Debe indicar municipio para registrar una parroquia.', 400);
      }

      parish = await geoRepository.findParishById(input.parish);

      if (!parish || parish.municipality.toString() !== input.municipality) {
        throw new AppError('La parroquia no pertenece al municipio indicado.', 400);
      }
    }

    return {
      country: country._id,
      state: state._id,
      city: city._id,
      ...(municipality && { municipality: municipality._id }),
      ...(parish && { parish: parish._id }),
    };
  },

  enrichUbicacion: async (ubicacion) => {
    if (!ubicacion?.state || !ubicacion?.city) {
      return null;
    }

    const [country, state, city, municipality, parish] = await Promise.all([
      ubicacion.country
        ? geoRepository.findCountryById(ubicacion.country)
        : geoLocationService.getDefaultCountry(),
      geoRepository.findStateById(ubicacion.state),
      geoRepository.findCityById(ubicacion.city),
      ubicacion.municipality
        ? geoRepository.findMunicipalityById(ubicacion.municipality)
        : null,
      ubicacion.parish ? geoRepository.findParishById(ubicacion.parish) : null,
    ]);

    if (!state || !city) {
      return null;
    }

    const parts = [city.name, municipality?.name, state.name, country?.name ?? 'Venezuela'].filter(
      Boolean,
    );

    return {
      country: country
        ? { id: country._id.toString(), name: country.name, code: country.code }
        : null,
      state: { id: state._id.toString(), name: state.name, iso_31662: state.iso_31662 },
      city: { id: city._id.toString(), name: city.name },
      municipality: municipality
        ? { id: municipality._id.toString(), name: municipality.name }
        : null,
      parish: parish ? { id: parish._id.toString(), name: parish.name } : null,
      display: parts.join(', '),
    };
  },
};
