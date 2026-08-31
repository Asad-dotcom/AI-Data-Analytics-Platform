import { S3Client } from '@aws-sdk/client-s3';

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME || 'ai-analytics-datasets';

// Cloudflare R2 endpoint URL format: https://<account_id>.r2.cloudflarestorage.com
const endpoint = r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : undefined;

export const s3Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId || 'mock-access-key',
    secretAccessKey: r2SecretAccessKey || 'mock-secret-key',
  },
});

export const r2Config = {
  bucketName: r2BucketName,
};
