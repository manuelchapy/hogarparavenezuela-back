import { Router } from 'express';
import { catchAsync } from '../middleware/catchAsync.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRole.js';
import {
  listUsersQuerySchema,
  rejectUserSchema,
} from '../validators/auth.validator.js';
import { objectIdParamSchema } from '../validators/institution.validator.js';
import { adminController } from '../controllers/admin.controller.js';
import { institutionController } from '../controllers/institution.controller.js';
import { entidadAtencionController } from '../controllers/entidadAtencion.controller.js';
import {
  createEntidadAtencionSchema,
  listEntidadAtencionQuerySchema,
} from '../validators/entidadAtencion.validator.js';
import {
  createInstitutionSchema,
  listInstitutionQuerySchema,
} from '../validators/institution.validator.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMINISTRADOR));

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      module: 'admin',
      routes: {
        listUsers: 'GET /api/admin/usuarios',
        approveUser: 'PATCH /api/admin/usuarios/:id/aprobar',
        rejectUser: 'PATCH /api/admin/usuarios/:id/rechazar',
        createInstitution: 'POST /api/admin/instituciones',
        createEntidadAtencion: 'POST /api/admin/entidades-atencion',
      },
    },
  });
});

router.get(
  '/usuarios',
  validate(listUsersQuerySchema, 'query'),
  catchAsync(adminController.listUsers),
);
router.patch(
  '/usuarios/:id/aprobar',
  validate(objectIdParamSchema, 'params'),
  catchAsync(adminController.approveUser),
);
router.patch(
  '/usuarios/:id/rechazar',
  validate(objectIdParamSchema, 'params'),
  validate(rejectUserSchema),
  catchAsync(adminController.rejectUser),
);

router.post(
  '/instituciones',
  validate(createInstitutionSchema),
  catchAsync(institutionController.create),
);

router.post(
  '/entidades-atencion',
  validate(createEntidadAtencionSchema),
  catchAsync(entidadAtencionController.create),
);

export default router;
