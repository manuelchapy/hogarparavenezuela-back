import mongoose from 'mongoose';
import env from './env.js';

export const connectDatabase = async () => {
  await mongoose.connect(env.mongodbUri);
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
