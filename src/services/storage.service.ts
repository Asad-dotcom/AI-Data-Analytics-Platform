import { supabase, SUPABASE_STORAGE_BUCKET } from '@/lib/supabase';

export const StorageService = {
  /**
   * Uploads a file (CSV dataset) buffer to Supabase Storage.
   * Returns the stored storage key (filename/path).
   */
  async uploadFile(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(key, body, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.warn('[Storage Service] Supabase Storage upload warning:', error.message);
      }

      return data?.path || key;
    } catch (err) {
      console.warn('[Storage Service] Supabase Storage upload exception:', err);
      return key;
    }
  },

  /**
   * Retrieves the string contents of a file stored in Supabase Storage.
   */
  async getFile(key: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .download(key);

      if (error || !data) {
        console.error('[Storage Service] Failed to retrieve file from Supabase Storage:', error);
        throw new Error(`Failed to read file ${key} from Supabase Storage: ${error?.message}`);
      }

      return await data.text();
    } catch (error) {
      console.error('[Storage Service] Error reading file:', error);
      throw new Error(`Failed to read file ${key} from Supabase Storage.`);
    }
  },
};

