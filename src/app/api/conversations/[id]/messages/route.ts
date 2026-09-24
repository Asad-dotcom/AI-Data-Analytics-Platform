import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { ConversationRepository } from '@/repositories/conversation.repository';
import { ConversationService } from '@/services/conversation.service';

/**
 * API Route: Retrieve all messages for a specific conversation
 * GET /api/conversations/[id]/messages
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const session = await AuthService.verifyToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session expired or invalid' }, { status: 401 });
    }

    const conversation = await ConversationRepository.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    }

    if (conversation.userId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Access forbidden: You do not own this conversation.' }, { status: 403 });
    }

    const messages = await ConversationService.getMessages(conversationId);

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('[Get Messages API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}
