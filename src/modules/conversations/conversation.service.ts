import { ApiResponse, Conversation, Message } from '@/types';

export const FrontendConversationService = {
  /**
   * Creates a new conversation session
   */
  async createConversation(token: string, title?: string): Promise<Conversation> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: title || 'New Analytics Chat' }),
    });

    const data: ApiResponse<Conversation> = await res.json();
    if (!res.ok || !data.success || !data.data) {
      throw new Error(data.error || 'Failed to create conversation session');
    }
    return data.data;
  },

  /**
   * Retrieves all conversation sessions for the user
   */
  async listConversations(token: string): Promise<Conversation[]> {
    const res = await fetch('/api/conversations', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data: ApiResponse<Conversation[]> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch conversations');
    }
    return data.data || [];
  },

  /**
   * Retrieves chronological messages for a conversation
   */
  async getMessages(token: string, conversationId: string): Promise<Message[]> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data: ApiResponse<Message[]> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch conversation messages');
    }
    return data.data || [];
  },

  /**
   * Submits a question (Mode 1 SQL AI or Mode 2 General AI)
   */
  async askQuestion(
    token: string,
    conversationId: string,
    query: string,
    datasetId?: string
  ): Promise<Message> {
    const res = await fetch(`/api/conversations/${conversationId}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        datasetId: datasetId || undefined,
      }),
    });

    const data: ApiResponse<Message> = await res.json();
    if (!res.ok || !data.success || !data.data) {
      throw new Error(data.error || 'Failed to process question');
    }
    return data.data;
  },
};
