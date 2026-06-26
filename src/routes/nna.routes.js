import { Router } from 'express';
import { catchAsync } from '../middleware/catchAsync.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRole.js';
import { requireActiveAccount } from '../middleware/requireActiveAccount.js';
import { authorizeTimelineEvent } from '../middleware/requireActiveAccount.js';
import { uploadSingleArchivo } from '../middleware/upload.js';
import { ROLES_CIERRE_LEGAL, ROLES_REGISTRO_NNA } from '../constants/index.js';
import {
  cierreLegalSchema,
  createNnaSchema,
  listNnaQuerySchema,
  nnaIdParamsSchema,
  timelineEventSchema,
  updateNnaUbicacionSchema,
} from '../validators/nna.validator.js';
import { nnaController } from '../controllers/nna.controller.js';

const router = Router();

router.get('/meta', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      module: 'nna',
      routes: {
        list: 'GET /api/nna',
        create: 'POST /api/nna',
        detail: 'GET /api/nna/:id',
        updateUbicacion: 'PATCH /api/nna/:id/ubicacion',
        timeline: 'PATCH /api/nna/:id/timeline',
        cierreLegal: 'POST /api/nna/:id/cierre-legal (solo CPNNA/ADMIN)',
        subirFotoPrevia: 'POST /api/nna/subir-foto',
        uploadArchivo: 'POST /api/nna/:id/archivos',
      },
    },
  });
});

router.use(authenticate);
router.use(requireActiveAccount);

router.post('/subir-foto', uploadSingleArchivo, catchAsync(nnaController.uploadFotoPrevia));
router.get('/', validate(listNnaQuerySchema, 'query'), catchAsync(nnaController.list));
router.post(
  '/',
  authorizeRoles(...ROLES_REGISTRO_NNA),
  validate(createNnaSchema),
  catchAsync(nnaController.create),
);
router.get('/:id', validate(nnaIdParamsSchema, 'params'), catchAsync(nnaController.getById));
router.patch(
  '/:id/ubicacion',
  authorizeRoles(...ROLES_REGISTRO_NNA),
  validate(nnaIdParamsSchema, 'params'),
  validate(updateNnaUbicacionSchema),
  catchAsync(nnaController.updateUbicacion),
);
router.patch(
  '/:id/timeline',
  validate(nnaIdParamsSchema, 'params'),
  validate(timelineEventSchema),
  authorizeTimelineEvent,
  catchAsync(nnaController.appendTimeline),
);
router.post(
  '/:id/cierre-legal',
  validate(nnaIdParamsSchema, 'params'),
  validate(cierreLegalSchema),
  authorizeRoles(...ROLES_CIERRE_LEGAL),
  authorizeTimelineEvent,
  catchAsync(nnaController.cierreLegal),
);
router.post(
  '/:id/archivos',
  authorizeRoles(...ROLES_REGISTRO_NNA),
  validate(nnaIdParamsSchema, 'params'),
  uploadSingleArchivo,
  catchAsync(nnaController.uploadArchivo),
);

export default router;
