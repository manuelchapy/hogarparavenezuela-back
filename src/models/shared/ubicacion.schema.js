import mongoose from 'mongoose';

export const ubicacionSchemaDefinition = {
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true,
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true,
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
  },
  municipality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Municipality',
  },
  parish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parish',
  },
};

export const ubicacionSchema = new mongoose.Schema(ubicacionSchemaDefinition, { _id: false });

export const ubicacionIndexes = [
  { 'ubicacion.state': 1, 'ubicacion.city': 1 },
  { 'ubicacion.country': 1 },
];
