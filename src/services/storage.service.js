import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Storage } from '@google-cloud/storage';
import env from '../config/env.js';
import { AppError } from '../errors/AppError.js';

const createS3Client = () =>
  new S3Client({
    region: env.aws.region,
    credentials:
      env.aws.accessKeyId && env.aws.secretAccessKey
        ? {
            accessKeyId: env.aws.accessKeyId,
            secretAccessKey: env.aws.secretAccessKey,
          }
        : undefined,
  });

const createGcsClient = () =>
  new Storage({
    projectId: env.gcs.projectId,
    keyFilename: env.gcs.keyFilename,
  });

const s3Storage = {
  uploadStream: async ({ key, stream, contentType }) => {
    if (!env.aws.bucket) {
      throw new AppError('Bucket S3 no configurado.', 503);
    }

    const client = createS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: env.aws.bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
      }),
    );

    return {
      storagePath: key,
      url: `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`,
    };
  },

  getSignedUrl: async ({ key, expiresIn = 3600 }) => {
    const client = createS3Client();
    const command = new GetObjectCommand({ Bucket: env.aws.bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn });
  },
};

const gcsStorage = {
  uploadStream: async ({ key, stream, contentType }) => {
    if (!env.gcs.bucket) {
      throw new AppError('Bucket GCS no configurado.', 503);
    }

    const storage = createGcsClient();
    const file = storage.bucket(env.gcs.bucket).file(key);

    await new Promise((resolve, reject) => {
      const writeStream = file.createWriteStream({
        resumable: false,
        metadata: { contentType },
      });

      stream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      stream.on('error', reject);
    });

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 3600 * 1000,
    });

    return { storagePath: key, url: signedUrl };
  },

  getSignedUrl: async ({ key, expiresIn = 3600 }) => {
    const storage = createGcsClient();
    const file = storage.bucket(env.gcs.bucket).file(key);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });
    return url;
  },
};

const localStorage = {
  uploadStream: async ({ key, stream, contentType }) => {
    const rootDir = path.resolve(env.localStorage.path);
    const filePath = path.join(rootDir, key);

    await mkdir(path.dirname(filePath), { recursive: true });
    await pipeline(stream, createWriteStream(filePath));

    const publicKey = key.replace(/\\/g, '/');

    return {
      storagePath: key,
      url: `${env.publicBaseUrl}/uploads/${publicKey}`,
      contentType,
    };
  },

  getSignedUrl: async ({ key }) => {
    const publicKey = key.replace(/\\/g, '/');
    return `${env.publicBaseUrl}/uploads/${publicKey}`;
  },
};

const providers = {
  s3: s3Storage,
  gcs: gcsStorage,
  local: localStorage,
};

export const getStorageProvider = () => {
  const provider = providers[env.storageProvider];

  if (!provider) {
    throw new AppError(`Proveedor de almacenamiento no soportado: ${env.storageProvider}`, 500);
  }

  return provider;
};

export const storageService = {
  uploadStream: (params) => getStorageProvider().uploadStream(params),
  getSignedUrl: (params) => getStorageProvider().getSignedUrl(params),
};
