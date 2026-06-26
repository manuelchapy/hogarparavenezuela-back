import { DEFAULT_COUNTRY_CODE } from '../constants/geo.js';
import { geoRepository, mapGeoItem } from '../repositories/geo.repository.js';
import { geoLocationService } from './geoLocation.service.js';
import { AppError } from '../errors/AppError.js';

const mapState = (state) => ({
  id: state._id.toString(),
  name: state.name,
  iso_31662: state.iso_31662,
  capital: state.capital,
  id_estado: state.id_estado,
});

const mapMunicipality = (item) => ({
  id: item._id.toString(),
  name: item.name,
  capital: item.capital ?? null,
  id_estado: item.id_estado,
});

export const geoService = {
  getCatalog: async () => {
    const country = await geoLocationService.getDefaultCountry();

    return {
      defaultCountryCode: DEFAULT_COUNTRY_CODE,
      country: {
        id: country._id.toString(),
        name: country.name,
        code: country.code,
      },
      routes: {
        states: 'GET /api/geo/states',
        citiesByState: 'GET /api/geo/states/:stateId/cities',
        municipalitiesByState: 'GET /api/geo/states/:stateId/municipalities',
        parishesByMunicipality: 'GET /api/geo/municipalities/:municipalityId/parishes',
      },
    };
  },

  listCountries: async () => {
    const countries = await geoRepository.listCountries();
    return countries.map((country) => ({
      id: country._id.toString(),
      name: country.name,
      code: country.code,
    }));
  },

  listStates: async ({ search, limit }) => {
    const country = await geoLocationService.getDefaultCountry();
    const states = await geoRepository.listStates({
      countryId: country._id,
      search,
      limit,
    });

    return {
      country: { id: country._id.toString(), name: country.name, code: country.code },
      count: states.length,
      items: states.map(mapState),
    };
  },

  listCitiesByState: async (stateId, { search, limit }) => {
    const state = await geoRepository.findStateById(stateId);

    if (!state) {
      throw new AppError('Estado no encontrado.', 404);
    }

    const cities = await geoRepository.listCitiesByState({ stateId, search, limit });

    return {
      state: mapState(state),
      count: cities.length,
      items: cities.map(mapGeoItem),
    };
  },

  listMunicipalitiesByState: async (stateId, { search, limit }) => {
    const state = await geoRepository.findStateById(stateId);

    if (!state) {
      throw new AppError('Estado no encontrado.', 404);
    }

    const municipalities = await geoRepository.listMunicipalitiesByState({
      stateId,
      search,
      limit,
    });

    return {
      state: mapState(state),
      count: municipalities.length,
      items: municipalities.map(mapMunicipality),
    };
  },

  listParishesByMunicipality: async (municipalityId, { search, limit }) => {
    const municipality = await geoRepository.findMunicipalityById(municipalityId);

    if (!municipality) {
      throw new AppError('Municipio no encontrado.', 404);
    }

    const parishes = await geoRepository.listParishesByMunicipality({
      municipalityId,
      search,
      limit,
    });

    return {
      municipality: mapMunicipality(municipality),
      count: parishes.length,
      items: parishes.map(mapGeoItem),
    };
  },
};
