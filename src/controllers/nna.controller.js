import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { nnaService } from '../services/nna.service.js';
import { storageService } from '../services/storage.service.js';
import { prepareFileForUpload } from '../services/imageProcessing.service.js';
import { getAuditContext } from '../utils/requestContext.js';

export const nnaController = {
  list: async (req, res) => {
    const result = await nnaService.list(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  getById: async (req, res) => {
    const nna = await nnaService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: { nna },
    });
  },

  create: async (req, res) => {
    const { nna, created } = await nnaService.create(req.body, req.user, getAuditContext(req));

    res.status(created ? 201 : 200).json({
      success: true,
      data: { nna, created },
    });
  },

  appendTimeline: async (req, res) => {
    const { nna, duplicated } = await nnaService.appendTimelineEvent(
      req.params.id,
      req.body,
      req.user,
      getAuditContext(req),
    );

    res.status(200).json({
      success: true,
      data: { nna, duplicated },
    });
  },

  cierreLegal: async (req, res) => {
    const { nna, duplicated } = await nnaService.registrarCierreLegal(
      req.params.id,
      req.body,
      req.user,
      getAuditContext(req),
    );

    res.status(200).json({
      success: true,
      data: { nna, duplicated },
    });
  },

  updateUbicacion: async (req, res) => {
    const nna = await nnaService.updateUbicacion(
      req.params.id,
      req.body.ubicacion,
      req.user,
      getAuditContext(req),
    );

    res.status(200).json({
      success: true,
      data: { nna },
    });
  },

  uploadFotoPrevia: async (req, res) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Debes enviar un archivo en el campo archivo (multipart/form-data).',
      });
    }

    const prepared = await prepareFileForUpload(file);
    const key = `nna/previa/${req.user.cedula}-${randomUUID()}.${prepared.extension}`;

    const uploaded = await storageService.uploadStream({
      key,
      stream: Readable.from(prepared.buffer),
      contentType: prepared.contentType,
    });

    res.status(201).json({
      success: true,
      data: {
        fotoUrl: uploaded.url,
        storagePath: uploaded.storagePath,
        contentType: prepared.contentType,
        convertedToWebp: prepared.converted,
      },
      message: 'Usa fotoUrl al crear el registro NNA.',
    });
  },

  uploadArchivo: async (req, res) => {
    const nnaId = req.params.id;
    const tipo = req.body?.tipo;
    const file = req.file;

    if (!['FOTO_ROSTRO', 'ACTA_ENTREGA'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Campo tipo inválido. Usa FOTO_ROSTRO o ACTA_ENTREGA.',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Debes enviar un archivo en el campo archivo (multipart/form-data).',
      });
    }

    const prepared = await prepareFileForUpload(file);
    const key = `nna/${nnaId}/${tipo.toLowerCase()}-${randomUUID()}.${prepared.extension}`;

    const uploaded = await storageService.uploadStream({
      key,
      stream: Readable.from(prepared.buffer),
      contentType: prepared.contentType,
    });

    if (tipo === 'FOTO_ROSTRO') {
      const nna = await nnaService.updateFotoUrl(nnaId, uploaded.url);

      return res.status(201).json({
        success: true,
        data: {
          fotoUrl: uploaded.url,
          storagePath: uploaded.storagePath,
          contentType: prepared.contentType,
          convertedToWebp: prepared.converted,
          nna,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        archivo: {
          tipo,
          url: uploaded.url,
          storagePath: uploaded.storagePath,
          contentType: prepared.contentType,
          convertedToWebp: prepared.converted,
        },
      },
      message: 'Usa scannedActaUrl al registrar el cierre legal.',
    });
  },
};
