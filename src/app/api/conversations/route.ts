import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { ConversationRepository } from '@/repositories/conversation.repository';

/**
 * API Route: Create a new Conversation Session
 * POST /api/conversations
 */
export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const title = body.title?.trim() || 'New Conversation';

    // Persist new conversation thread
    const conversation = await ConversationRepository.create(session.userId, title);

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('[Create Conversation API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}

/**
 * API Route: List All Conversations for the active User
 * GET /api/conversations
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

    const conversations = await ConversationRepository.findByUserId(session.userId);

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('[List Conversations API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}
