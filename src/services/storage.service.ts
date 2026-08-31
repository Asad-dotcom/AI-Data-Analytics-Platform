import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, r2Config } from '@/lib/r2';

export const StorageService = {
  /**
   * Uploads a file (CSV dataset) buffer to Cloudflare R2.
   * Returns the stored storage key (filename/path).
   */
  async uploadFile(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return key;
  },

  /**
   * Retrieves the string contents of a file stored in Cloudflare R2.
   */
  async getFile(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });
    
    try {
      const response = await s3Client.send(command);
      const bodyStr = await response.Body?.transformToString();
      return bodyStr || '';
    } catch (error) {
      console.error('[Storage Service] Failed to retrieve file from R2:', error);
      throw new Error(`Failed to read file ${key} from R2 storage.`);
    }
  },
};
