import { Router } from 'express';
import { catchAsync } from '../middleware/catchAsync.js';
import { validate } from '../middleware/validate.js';
import {
  institutionIdParamSchema,
  listInstitutionQuerySchema,
} from '../validators/institution.validator.js';
import { institutionController } from '../controllers/institution.controller.js';

const router = Router();

router.get('/', validate(listInstitutionQuerySchema, 'query'), catchAsync(institutionController.list));
router.get(
  '/:id',
  validate(institutionIdParamSchema, 'params'),
  catchAsync(institutionController.getById),
);

export default router;
