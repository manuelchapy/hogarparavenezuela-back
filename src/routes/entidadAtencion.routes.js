import { Router } from 'express';
import { catchAsync } from '../middleware/catchAsync.js';
import { validate } from '../middleware/validate.js';
import {
  entidadAtencionIdParamSchema,
  listEntidadAtencionQuerySchema,
} from '../validators/entidadAtencion.validator.js';
import { entidadAtencionController } from '../controllers/entidadAtencion.controller.js';

const router = Router();

router.get(
  '/',
  validate(listEntidadAtencionQuerySchema, 'query'),
  catchAsync(entidadAtencionController.list),
);
router.get(
  '/:id',
  validate(entidadAtencionIdParamSchema, 'params'),
  catchAsync(entidadAtencionController.getById),
);

export default router;
