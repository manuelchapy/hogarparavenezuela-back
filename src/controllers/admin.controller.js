import { authService } from '../services/auth.service.js';
import { getAuditContext } from '../utils/requestContext.js';

export const adminController = {
  listUsers: async (req, res) => {
    const result = await authService.listUsers(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  approveUser: async (req, res) => {
    const user = await authService.approveUser(req.params.id, req.user, getAuditContext(req));

    res.status(200).json({
      success: true,
      data: { user },
      message: 'Cuenta aprobada. El operador ya puede iniciar sesión.',
    });
  },

  rejectUser: async (req, res) => {
    const user = await authService.rejectUser(
      req.params.id,
      req.body.motivoRechazo,
      req.user,
      getAuditContext(req),
    );

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
};
