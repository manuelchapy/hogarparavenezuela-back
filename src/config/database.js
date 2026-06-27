import mongoose from 'mongoose';
import env from './env.js';

export const connectDatabase = async () => {
  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
