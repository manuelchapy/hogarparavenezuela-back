import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { authService } from '../services/auth.service.js';
import { storageService } from '../services/storage.service.js';
import { prepareFileForUpload } from '../services/imageProcessing.service.js';
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

  uploadVerificacion: async (req, res) => {
    const file = req.file;
    const cedula = req.body?.cedula?.trim()?.replace(/[^a-zA-Z0-9]/g, '') || 'anon';
    const tipo = req.body?.tipo === 'CREDENCIAL' ? 'credencial' : 'cedula';

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Debes enviar un archivo en el campo archivo (multipart/form-data).',
      });
    }

    const prepared = await prepareFileForUpload(file);
    const key = `auth/verificacion/${cedula}-${tipo}-${randomUUID()}.${prepared.extension}`;

    const uploaded = await storageService.uploadStream({
      key,
      stream: Readable.from(prepared.buffer),
      contentType: prepared.contentType,
    });

    res.status(201).json({
      success: true,
      data: {
        url: uploaded.url,
        storagePath: uploaded.storagePath,
        contentType: prepared.contentType,
        convertedToWebp: prepared.converted,
      },
    });
  },
};
