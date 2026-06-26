import { authService } from '../services/auth.service.js';
import { getAuditContext } from '../utils/requestContext.js';

export const authController = {
  solicitud: async (req, res) => {
    const result = await authService.solicitud(req.body, getAuditContext(req));

    res.status(202).json({
      success: true,
      data: result,
    });
  },

  bootstrapAdmin: async (req, res) => {
    const result = await authService.bootstrapAdmin(req.body, getAuditContext(req));

    res.status(201).json({
      success: true,
      data: result,
    });
  },

  register: async (req, res) => {
    const result = await authService.register(req.body, req.user, getAuditContext(req));

    res.status(201).json({
      success: true,
      data: result,
    });
  },

  login: async (req, res) => {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  me: async (req, res) => {
    const user = await authService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  },

  updateMe: async (req, res) => {
    const user = await authService.updateProfile(req.user.id, req.body);

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
};
