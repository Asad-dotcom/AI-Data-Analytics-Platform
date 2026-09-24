import { ApiResponse, Dataset } from '@/types';

export const FrontendDatasetService = {
  /**
   * Retrieves all dataset catalog items for the current user
   */
  async listDatasets(token: string): Promise<Dataset[]> {
    const res = await fetch('/api/datasets', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data: ApiResponse<Dataset[]> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to list datasets');
    }
    return data.data || [];
  },

  /**
   * Uploads CSV, XLSX, or PDF dataset file
   */
  async uploadDataset(token: string, file: File): Promise<Dataset> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/datasets/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data: ApiResponse<Dataset> = await res.json();
    if (!res.ok || !data.success || !data.data) {
      throw new Error(data.error || 'Failed to upload dataset file');
    }
    return data.data;
  },

  /**
   * Deletes a dataset catalog record
   */
  async deleteDataset(token: string, datasetId: string): Promise<boolean> {
    const res = await fetch(`/api/datasets/${datasetId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data: ApiResponse<{ deleted: boolean }> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete dataset');
    }
    return true;
  },
};
