import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

const parseCloudinaryUrl = (raw?: string) => {
  if (!raw) return null;
  const m = raw.trim().match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/i);
  if (!m) return null;
  return { api_key: m[1].trim(), api_secret: m[2].trim(), cloud_name: m[3].trim() };
};

const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
const cloudName = (env.CLOUDINARY_CLOUD_NAME || parsed?.cloud_name || '').trim();
const apiKey = (env.CLOUDINARY_API_KEY || parsed?.api_key || '').trim();
const apiSecret = (env.CLOUDINARY_API_SECRET || parsed?.api_secret || '').trim();

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export const isCloudinaryConfigured = (): boolean =>
  Boolean(
    cloudName &&
      cloudName !== 'hydra-demo' &&
      apiKey &&
      apiKey !== '123456789012345' &&
      apiSecret &&
      apiSecret !== 'sample_cloudinary_secret_key'
  );

export default cloudinary;
