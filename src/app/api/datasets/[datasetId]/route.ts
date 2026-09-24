import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { DatasetRepository } from '@/repositories/dataset.repository';
import { StorageService } from '@/services/storage.service';
import { db } from '@/lib/db';

/**
 * API Route: Delete a Dataset
 * DELETE /api/datasets/[datasetId]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  try {
    const { datasetId } = await params;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing Authorization header token' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const session = await AuthService.verifyToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session expired or invalid token' }, { status: 401 });
    }

    if (!datasetId) {
      return NextResponse.json({ success: false, error: 'Bad Request: Missing dataset ID' }, { status: 400 });
    }

    const dataset = await DatasetRepository.findById(datasetId);
    if (!dataset) {
      return NextResponse.json({ success: false, error: 'Not Found: Dataset does not exist' }, { status: 404 });
    }

    if (dataset.userId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to delete this dataset' }, { status: 403 });
    }

    // 1. Drop dynamic PostgreSQL data table
    if (dataset.tableName) {
      try {
        await db.query(`DROP TABLE IF EXISTS "${dataset.tableName}"`);
      } catch (err) {
        console.warn(`[Delete Dataset API] Failed to drop dataset table: ${dataset.tableName}`, err);
      }
    }

    // 2. Delete file from storage
    if (dataset.r2Key) {
      try {
        await StorageService.deleteFile(dataset.r2Key);
      } catch (err) {
        console.warn(`[Delete Dataset API] Failed to delete file from storage: ${dataset.r2Key}`, err);
      }
    }

    // 3. Delete metadata record
    const deleted = await DatasetRepository.delete(datasetId);

    return NextResponse.json({
      success: true,
      data: { deleted },
    });
  } catch (error) {
    console.error('[Delete Dataset API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}
