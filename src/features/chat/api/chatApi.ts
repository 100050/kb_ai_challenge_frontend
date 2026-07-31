import { buildApiUrl, requestJson } from '../../../api/httpClient';
import type {
  ChatHistoryResponse,
  ChatStreamEvent,
} from '../model/chatTypes';

export function getChatMessages(
  analysisId: string,
  signal?: AbortSignal,
) {
  return requestJson<ChatHistoryResponse>(
    `/analyses/${analysisId}/chat/messages`,
    { signal },
  );
}

export async function streamChatMessage(
  analysisId: string,
  content: string,
  onEvent: (event: ChatStreamEvent) => void | Promise<void>,
  signal?: AbortSignal,
) {
  const response = await fetch(
    buildApiUrl(`/analyses/${analysisId}/chat/messages`),
    {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
      signal,
    },
  );

  if (!response.ok || !response.body) {
    throw new Error('AI 답변을 시작하지 못했습니다.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const consumeBlock = async (block: string) => {
    let eventName = 'message';
    const dataLines: string[] = [];

    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length === 0) {
      return;
    }

    await onEvent({
      type: eventName,
      data: JSON.parse(dataLines.join('\n')) as unknown,
    } as ChatStreamEvent);
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      await consumeBlock(block);
    }

    if (done) {
      if (buffer.trim()) {
        await consumeBlock(buffer);
      }
      break;
    }
  }
}

export async function clearChatMessages(analysisId: string) {
  const response = await fetch(
    buildApiUrl(`/analyses/${analysisId}/chat/messages`),
    { method: 'DELETE' },
  );
  if (!response.ok) {
    throw new Error('대화 기록을 초기화하지 못했습니다.');
  }
}
