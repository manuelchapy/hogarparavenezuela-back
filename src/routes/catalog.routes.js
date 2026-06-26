import { Router } from 'express';
import { catchAsync } from '../middleware/catchAsync.js';
import { validate } from '../middleware/validate.js';
import { catalogKeyParamSchema } from '../validators/catalog.validator.js';
import { catalogController } from '../controllers/catalog.controller.js';

const router = Router();

router.get('/', catchAsync(catalogController.index));
router.get('/all', catchAsync(catalogController.getAll));
router.get('/:key', validate(catalogKeyParamSchema, 'params'), catchAsync(catalogController.getByKey));

export default router;
