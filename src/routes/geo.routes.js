import { Router } from 'express';
import { catchAsync } from '../middleware/catchAsync.js';
import { validate } from '../middleware/validate.js';
import {
  listGeoQuerySchema,
  municipalityIdParamSchema,
  stateIdParamSchema,
} from '../validators/geo.validator.js';
import { geoController } from '../controllers/geo.controller.js';

const router = Router();

router.get('/', catchAsync(geoController.catalog));
router.get('/countries', catchAsync(geoController.listCountries));
router.get('/states', validate(listGeoQuerySchema, 'query'), catchAsync(geoController.listStates));
router.get(
  '/states/:stateId/cities',
  validate(stateIdParamSchema, 'params'),
  validate(listGeoQuerySchema, 'query'),
  catchAsync(geoController.listCitiesByState),
);
router.get(
  '/states/:stateId/municipalities',
  validate(stateIdParamSchema, 'params'),
  validate(listGeoQuerySchema, 'query'),
  catchAsync(geoController.listMunicipalitiesByState),
);
router.get(
  '/municipalities/:municipalityId/parishes',
  validate(municipalityIdParamSchema, 'params'),
  validate(listGeoQuerySchema, 'query'),
  catchAsync(geoController.listParishesByMunicipality),
);

export default router;
