import { Router } from 'express';
import { catchAsync } from '../middleware/catchAsync.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRole.js';
import {
  bootstrapAdminSchema,
  loginSchema,
  registerSchema,
  solicitudSchema,
  updateMeSchema,
} from '../validators/auth.validator.js';
import { authController } from '../controllers/auth.controller.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      module: 'auth',
      routes: {
        solicitud: 'POST /api/auth/solicitud',
        bootstrapAdmin: 'POST /api/auth/bootstrap-admin',
        register: 'POST /api/auth/register (solo ADMINISTRADOR)',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        updateMe: 'PATCH /api/auth/me',
      },
    },
  });
});

router.post('/solicitud', validate(solicitudSchema), catchAsync(authController.solicitud));
router.post(
  '/bootstrap-admin',
  validate(bootstrapAdminSchema),
  catchAsync(authController.bootstrapAdmin),
);
router.post('/login', validate(loginSchema), catchAsync(authController.login));

router.post(
  '/register',
  authenticate,
  authorizeRoles(ROLES.ADMINISTRADOR),
  validate(registerSchema),
  catchAsync(authController.register),
);

router.get('/me', authenticate, catchAsync(authController.me));
router.patch('/me', authenticate, validate(updateMeSchema), catchAsync(authController.updateMe));

export default router;
