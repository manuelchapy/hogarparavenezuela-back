import User from '../models/User.js';
import { ACCOUNT_STATUS, ROLES } from '../constants/index.js';

const userPublicSelect =
  'nombreCompleto cedula telefono rol institucionId institucion credencialOficialId fotoCedulaUrl fotoCredencialUrl ubicacion estadoCuenta activo verificadoPor verificadoEn motivoRechazo documentosVerificacion createdAt updatedAt';

export const userRepository = {
  findByCedula: (cedula) => User.findOne({ cedula: cedula.trim().toUpperCase() }).lean(),

  findById: (id) => User.findById(id).select(userPublicSelect).lean(),

  countByRole: (rol) => User.countDocuments({ rol }),

  list: ({ estadoCuenta, rol, limit = 50, page = 1 }) => {
    const filter = {};

    if (estadoCuenta) filter.estadoCuenta = estadoCuenta;
    if (rol) filter.rol = rol;

    const skip = (page - 1) * limit;

    return Promise.all([
      User.find(filter).select(userPublicSelect).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
  },

  create: (payload) => User.create(payload),

  updateById: (id, payload) =>
    User.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
      .select(userPublicSelect)
      .lean(),

  findActiveAdminExists: () =>
    User.exists({ rol: ROLES.ADMINISTRADOR, estadoCuenta: ACCOUNT_STATUS.ACTIVO }),
};
