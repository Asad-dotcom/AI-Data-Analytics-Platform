import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { AskQuestionSchema } from '@/validators';
import { ConversationService } from '@/services/conversation.service';
import { ConversationRepository } from '@/repositories/conversation.repository';
import { RateLimitingService } from '@/services/rate-limiting.service';

/**
 * API Route: Submit a query / Ask a question inside a conversation
 * POST /api/conversations/[id]/ask
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 16, dynamic params must be awaited
    const { id: conversationId } = await params;

    // 1. Authenticate user session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const session = await AuthService.verifyToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session expired or invalid' }, { status: 401 });
    }

    // 2. Apply sliding window Redis-based Rate Limiting (e.g., 20 questions per minute per user)
    const rateLimit = await RateLimitingService.checkRateLimit(session.userId, 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. You have reached your rate limit. Please wait a minute.' },
        { status: 429 }
      );
    }

    // 3. Retrieve conversation and verify user ownership
    const conversation = await ConversationRepository.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    }

    if (conversation.userId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Access forbidden: You do not own this conversation.' }, { status: 403 });
    }

    // 4. Validate query payload schema
    const body = await request.json();
    const validationResult = AskQuestionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { question, datasetId } = validationResult.data;

    // 5. Orchestrate analytics pipeline processing (Mode 1 SQL run, or Mode 2 Gemini run)
    const replyMessage = await ConversationService.handleUserQuestion(
      session.userId,
      conversationId,
      question,
      datasetId
    );

    return NextResponse.json({
      success: true,
      data: replyMessage,
    });
  } catch (error) {
    console.error('[Ask API] Execution Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'An unexpected error occurred during processing.' },
      { status: 500 }
    );
  }
}
