import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { ConversationRepository } from '@/repositories/conversation.repository';

/**
 * API Route: Get or Delete a specific conversation by ID
 * GET /api/conversations/[id]
 * DELETE /api/conversations/[id]
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

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('[Get Conversation API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const deleted = await ConversationRepository.delete(conversationId);

    return NextResponse.json({
      success: true,
      data: { deleted },
    });
  } catch (error) {
    console.error('[Delete Conversation API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred.' },
      { status: 500 }
    );
  }
}
