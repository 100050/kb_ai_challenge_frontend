export interface ChatHistoryMessage {
  turn_id: string;
  user_content: string;
  assistant_content: string | null;
  status: 'completed' | 'failed';
  created_at: string;
}

export interface ChatHistoryResponse {
  conversation_id: string | null;
  messages: ChatHistoryMessage[];
}

export interface ChatTurn {
  turn_id: string;
  role: 'assistant';
  content: string | null;
  status: 'completed' | 'failed';
  created_at: string;
}

export type ChatStreamEvent =
  | { type: 'message_start'; data: { analysis_id: string } }
  | { type: 'message_delta'; data: { content: string } }
  | { type: 'message_end'; data: ChatTurn }
  | { type: 'error'; data: { code?: string; message?: string } };
