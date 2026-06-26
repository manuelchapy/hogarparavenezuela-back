import mongoose from 'mongoose';

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  },
  { timestamps: true },
);

const stateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    iso_31662: { type: String, required: true, trim: true },
    capital: { type: String, required: true, trim: true },
    id_estado: { type: Number, required: true, unique: true },
  },
  { timestamps: true },
);

stateSchema.index({ country: 1, name: 1 }, { unique: true });

const municipalitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    capital: { type: String, trim: true },
    id_estado: { type: Number, required: true },
  },
  { timestamps: true },
);

municipalitySchema.index({ state: 1, name: 1 }, { unique: true });

const parishSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    municipality: { type: mongoose.Schema.Types.ObjectId, ref: 'Municipality', required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    id_estado: { type: Number, required: true },
  },
  { timestamps: true },
);

parishSchema.index({ municipality: 1, name: 1 }, { unique: true });

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    id_estado: { type: Number, required: true },
  },
  { timestamps: true },
);

citySchema.index({ state: 1, name: 1 }, { unique: true });

export const Country = mongoose.models.Country || mongoose.model('Country', countrySchema);
export const State = mongoose.models.State || mongoose.model('State', stateSchema);
export const Municipality =
  mongoose.models.Municipality || mongoose.model('Municipality', municipalitySchema);
export const Parish = mongoose.models.Parish || mongoose.model('Parish', parishSchema);
export const City = mongoose.models.City || mongoose.model('City', citySchema);
