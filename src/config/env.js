import dotenv from 'dotenv';

dotenv.config();

const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hogarparavenezuela',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  storageProvider: process.env.STORAGE_PROVIDER || 's3',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET,
  },
  gcs: {
    projectId: process.env.GCS_PROJECT_ID,
    bucket: process.env.GCS_BUCKET,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL,
    webhookSecret: process.env.N8N_WEBHOOK_SECRET,
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  bootstrapSecret: process.env.BOOTSTRAP_SECRET,
};

export default env;
