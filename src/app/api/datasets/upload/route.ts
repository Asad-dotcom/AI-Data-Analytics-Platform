import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { StorageService } from '@/services/storage.service';
import { ProcessingService } from '@/services/processing.service';
import { DatasetRepository } from '@/repositories/dataset.repository';
import crypto from 'crypto';

/**
 * API Route: Dataset Upload (CSV)
 * POST /api/datasets/upload
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing Authorization header token' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const session = await AuthService.verifyToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session expired or invalid token' }, { status: 401 });
    }

    // 2. Parse form data payload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'Bad Request: No file uploaded.' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ success: false, error: 'Bad Request: Only CSV files (.csv) are supported.' }, { status: 400 });
    }

    // Convert file contents to buffer and string
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const csvContent = fileBuffer.toString('utf-8');

    // 3. Initialize unique dataset identifiers
    const datasetId = crypto.randomUUID();
    const storageKey = `datasets/${session.userId}/${datasetId}.csv`;

    // 4. Save original file to Supabase Storage
    await StorageService.uploadFile(storageKey, fileBuffer, file.type || 'text/csv');

    // 5. Parse, infer schemas, and load records into a dedicated PostgreSQL table
    const { tableName, rowCount } = await ProcessingService.processAndLoadCsv(datasetId, csvContent);

    // 6. Persist dataset catalog record in database
    const dataset = await DatasetRepository.create({
      userId: session.userId,
      originalFilename: file.name,
      r2Key: storageKey,
      tableName,
      rowCount,
    });

    return NextResponse.json(
      {
        success: true,
        data: dataset,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Dataset Upload API] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to process and load CSV dataset.' },
      { status: 500 }
    );
  }
}
