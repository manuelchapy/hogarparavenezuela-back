import { Country, State, City, Municipality, Parish } from '../models/geo/index.js';

const leanItem = (doc) => ({
  id: doc._id.toString(),
  name: doc.name,
});

export const geoRepository = {
  findCountryByCode: (code) => Country.findOne({ code }).select('_id name code').lean(),

  findCountryById: (id) => Country.findById(id).select('_id name code').lean(),

  listCountries: () => Country.find().select('_id name code').sort({ name: 1 }).lean(),

  listStates: ({ countryId, search, limit }) => {
    const filter = { country: countryId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    return State.find(filter)
      .select('_id name iso_31662 capital id_estado')
      .sort({ name: 1 })
      .limit(limit)
      .lean();
  },

  findStateById: (id) =>
    State.findById(id).select('_id name iso_31662 capital id_estado country').lean(),

  listCitiesByState: ({ stateId, search, limit }) => {
    const filter = { state: stateId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    return City.find(filter).select('_id name id_estado').sort({ name: 1 }).limit(limit).lean();
  },

  findCityById: (id) => City.findById(id).select('_id name state country id_estado').lean(),

  listMunicipalitiesByState: ({ stateId, search, limit }) => {
    const filter = { state: stateId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    return Municipality.find(filter)
      .select('_id name capital id_estado')
      .sort({ name: 1 })
      .limit(limit)
      .lean();
  },

  findMunicipalityById: (id) =>
    Municipality.findById(id).select('_id name capital state country id_estado').lean(),

  listParishesByMunicipality: ({ municipalityId, search, limit }) => {
    const filter = { municipality: municipalityId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    return Parish.find(filter).select('_id name id_estado').sort({ name: 1 }).limit(limit).lean();
  },

  findParishById: (id) =>
    Parish.findById(id).select('_id name municipality state country id_estado').lean(),
};

export const mapGeoItem = leanItem;
