import { geoService } from '../services/geo.service.js';

export const geoController = {
  catalog: async (req, res) => {
    const data = await geoService.getCatalog();

    res.status(200).json({ success: true, data });
  },

  listCountries: async (req, res) => {
    const items = await geoService.listCountries();

    res.status(200).json({ success: true, data: { items } });
  },

  listStates: async (req, res) => {
    const data = await geoService.listStates(req.query);

    res.status(200).json({ success: true, data });
  },

  listCitiesByState: async (req, res) => {
    const data = await geoService.listCitiesByState(req.params.stateId, req.query);

    res.status(200).json({ success: true, data });
  },

  listMunicipalitiesByState: async (req, res) => {
    const data = await geoService.listMunicipalitiesByState(req.params.stateId, req.query);

    res.status(200).json({ success: true, data });
  },

  listParishesByMunicipality: async (req, res) => {
    const data = await geoService.listParishesByMunicipality(req.params.municipalityId, req.query);

    res.status(200).json({ success: true, data });
  },
};
