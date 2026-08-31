export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dataset {
  id: string;
  userId: string;
  originalFilename: string;
  r2Key: string;
  tableName: string; // The dynamically generated database table name containing the structured dataset
  rowCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string | null;
  sqlResult?: unknown | null; // Stores query output rows or generic JSON data
  chartConfig?: unknown | null; // Stores configuration required for Recharts
  createdAt: Date;
}

// Common response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
