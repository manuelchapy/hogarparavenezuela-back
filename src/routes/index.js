import { Router } from 'express';
import authRoutes from './auth.routes.js';
import nnaRoutes from './nna.routes.js';
import geoRoutes from './geo.routes.js';
import healthRoutes from './health.routes.js';
import adminRoutes from './admin.routes.js';
import institutionRoutes from './institution.routes.js';
import entidadAtencionRoutes from './entidadAtencion.routes.js';
import catalogRoutes from './catalog.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/catalog', catalogRoutes);
router.use('/geo', geoRoutes);
router.use('/auth', authRoutes);
router.use('/institutions', institutionRoutes);
router.use('/entidades-atencion', entidadAtencionRoutes);
router.use('/admin', adminRoutes);
router.use('/nna', nnaRoutes);

export default router;
