import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { DatasetRepository } from '@/repositories/dataset.repository';

/**
 * API Route: List All Datasets for the active User
 * GET /api/datasets
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing Authorization header token' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const session = await AuthService.verifyToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session expired or invalid token' }, { status: 401 });
    }

    const datasets = await DatasetRepository.findByUserId(session.userId);

    return NextResponse.json({
      success: true,
      data: datasets,
    });
  } catch (error) {
    console.error('[List Datasets API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}
