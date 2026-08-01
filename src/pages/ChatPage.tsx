import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ApiError } from '../api/httpClient';
import { BrandLogo } from '../components/ui/BrandLogo';
import {
  getAnalysisResult,
  getHousingPlan,
} from '../features/analysis/api/analysisApi';
import type {
  AnalysisCandidateResult,
  HousingPlan,
} from '../features/analysis/model/analysisTypes';
import {
  clearChatMessages,
  getChatMessages,
  streamChatMessage,
} from '../features/chat/api/chatApi';

interface ChatPageProps {
  analysisId: string;
  onBack: () => void;
}

interface ViewMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function formatWon(value: number) {
  return `${(value / 10_000).toLocaleString('ko-KR', {
    maximumFractionDigits: 1,
  })}만 원`;
}

function formatSignedWon(value: number) {
  if (value === 0) {
    return '0만 원';
  }
  return `${value > 0 ? '+' : ''}${formatWon(value)}`;
}

function formatSignedPercent(value: number | null) {
  if (value === null) {
    return '—';
  }
  return `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR')}%`;
}

function messageError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export function ChatPage({
  analysisId,
  onBack,
}: ChatPageProps) {
  const [messages, setMessages] = useState<ViewMessage[]>([]);
  const [input, setInput] = useState('');
  const [candidates, setCandidates] = useState<AnalysisCandidateResult[]>([]);
  const [properties, setProperties] = useState<Record<string, HousingPlan>>({});
  const [activePropertyId, setActivePropertyId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getChatMessages(analysisId, controller.signal),
      getAnalysisResult(analysisId, controller.signal),
    ])
      .then(async ([history, result]) => {
        setMessages(
          history.messages.flatMap<ViewMessage>((message) => [
            {
              id: `${message.turn_id}-user`,
              role: 'user',
              content: message.user_content,
            },
            {
              id: `${message.turn_id}-assistant`,
              role: 'assistant',
              content: message.assistant_content ?? '',
            },
          ]),
        );

        setCandidates(result.candidates);
        setActivePropertyId(result.candidates[0]?.property_id ?? '');
        const loadedProperties = await Promise.all(
          result.candidates.map((resultCandidate) =>
            getHousingPlan(
              analysisId,
              resultCandidate.property_id,
              controller.signal,
            ),
          ),
        );
        setProperties(
          Object.fromEntries(
            loadedProperties.map((loadedProperty) => [
              loadedProperty.property_id,
              loadedProperty,
            ]),
          ),
        );
      })
      .catch((loadError: unknown) => {
        if (
          loadError instanceof DOMException &&
          loadError.name === 'AbortError'
        ) {
          return;
        }
        setError(messageError(loadError));
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [analysisId]);

  useEffect(() => {
    if (typeof messageEndRef.current?.scrollIntoView === 'function') {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isStreaming || trimmed.length > 4000) {
      return;
    }

    const requestId = crypto.randomUUID();
    const assistantId = `${requestId}-assistant`;
    setMessages((current) => [
      ...current,
      { id: `${requestId}-user`, role: 'user', content: trimmed },
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setInput('');
    setError('');
    setIsStreaming(true);

    try {
      await streamChatMessage(analysisId, trimmed, async (event) => {
        if (event.type === 'message_delta') {
          const characters = Array.from(event.data.content);
          const charactersPerFrame = 2;

          for (
            let index = 0;
            index < characters.length;
            index += charactersPerFrame
          ) {
            const nextText = characters
              .slice(index, index + charactersPerFrame)
              .join('');
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: message.content + nextText,
                    }
                  : message,
              ),
            );
            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, 18);
            });
          }
        }

        if (event.type === 'message_end') {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: event.data.content ?? message.content,
                  }
                : message,
            ),
          );
        }

        if (event.type === 'error') {
          throw new Error(
            event.data.message ?? 'AI 답변 중 오류가 발생했습니다.',
          );
        }
      });
    } catch (sendError) {
      setError(messageError(sendError));
      setMessages((current) =>
        current.filter((message) => message.id !== assistantId),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('현재 분석의 대화 기록을 모두 삭제할까요?')) {
      return;
    }
    try {
      await clearChatMessages(analysisId);
      setMessages([]);
      setError('');
    } catch (clearError) {
      setError(messageError(clearError));
    }
  };

  const candidate = useMemo(
    () =>
      candidates.find(
        (resultCandidate) =>
          resultCandidate.property_id === activePropertyId,
      ) ?? null,
    [activePropertyId, candidates],
  );
  const property = properties[activePropertyId] ?? null;

  return (
    <div className="chat-page">
      <header className="chat-header">
        <a href="/" aria-label="홈으로 이동">
          <BrandLogo />
        </a>
        <div>
          <button onClick={onBack} type="button">← 분석 결과로 돌아가기</button>
        </div>
      </header>

      <div className="chat-layout">
        <main className="chat-main">
          <div className="chat-main__heading">
            <div>
              <span aria-hidden="true">✦</span>
              <div>
                <h1>AI 상담 챗봇</h1>
                <p>분석 결과와 주거·금융에 대해 무엇이든 질문해 보세요.</p>
              </div>
            </div>
            <button onClick={handleClear} type="button">대화 초기화</button>
          </div>

          <div className="chat-messages" aria-live="polite">
            {isLoading ? (
              <div className="chat-state" role="status">대화를 불러오는 중입니다.</div>
            ) : messages.length === 0 ? (
              <div className="chat-welcome">
                <span aria-hidden="true">✦</span>
                <div>
                  <strong>안녕하세요! 가늠입니다.</strong>
                  <p>분석 결과나 주거, 대출, 재무관리에 대해 궁금한 점을 자유롭게 질문해 주세요.</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div className={`chat-message chat-message--${message.role}`} key={message.id}>
                  <div className="chat-message__bubble">
                    {message.role === 'assistant' ? (
                      message.content ? (
                        <ReactMarkdown
                          components={{
                            a: ({ children, ...props }) => (
                              <a
                                {...props}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {children}
                              </a>
                            ),
                          }}
                          remarkPlugins={[remarkGfm]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        '답변을 작성하고 있습니다…'
                      )
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messageEndRef} />
          </div>

          {error ? <p className="chat-error" role="alert">{error}</p> : null}

          <form className="chat-composer" onSubmit={handleSubmit}>
            <textarea
              aria-label="메시지"
              maxLength={4000}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="궁금한 내용을 입력해 주세요..."
              rows={1}
              value={input}
            />
            <button
              aria-label="메시지 전송"
              disabled={isStreaming || !input.trim()}
              type="submit"
            >
              ➤
            </button>
          </form>
          <small className="chat-disclaimer">
            AI의 답변은 참고용이며, 실제 의사결정은 본인의 판단에 따라 결정해 주세요.
          </small>
        </main>

        <aside className="chat-summary">
          <h2>현재 분석 요약</h2>
          <div className="chat-property-tabs" role="tablist">
            {candidates.map((resultCandidate) => (
              <button
                aria-selected={
                  resultCandidate.property_id === activePropertyId
                }
                className={
                  resultCandidate.property_id === activePropertyId
                    ? 'is-active'
                    : undefined
                }
                key={resultCandidate.property_id}
                onClick={() =>
                  setActivePropertyId(resultCandidate.property_id)
                }
                role="tab"
                type="button"
              >
                {resultCandidate.name}
              </button>
            ))}
          </div>
          <section className="chat-summary__property">
            <strong>{property?.name ?? candidate?.name ?? '불러오는 중'}</strong>
            <p>
              {property?.address ?? '주소 정보 없음'}
              {property?.exclusive_area_m2 !== null &&
              property?.exclusive_area_m2 !== undefined
                ? ` · ${property.exclusive_area_m2.toLocaleString('ko-KR')}㎡`
                : ''}
            </p>
          </section>
          <section className="chat-summary__metrics">
            <h3>가격 적정성</h3>
            <dl>
              <div>
                <dt>중앙값 대비 차이율</dt>
                <dd>
                  {formatSignedPercent(
                    candidate?.price_appropriateness
                      .difference_rate_from_median ?? null,
                  )}
                </dd>
              </div>
              <div>
                <dt>가격 백분위</dt>
                <dd>
                  {candidate?.price_appropriateness.price_percentile === null ||
                  candidate?.price_appropriateness.price_percentile ===
                    undefined
                    ? '—'
                    : `${candidate.price_appropriateness.price_percentile.toLocaleString('ko-KR')}백분위`}
                </dd>
              </div>
            </dl>
          </section>
          <section className="chat-summary__metrics">
            <h3>재무 분석</h3>
            <dl>
              <div>
                <dt>초기 필요자금</dt>
                <dd>
                  {candidate
                    ? formatWon(candidate.initial_funds.initial_cash_required)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>입주 후 유동자산</dt>
                <dd>
                  {candidate
                    ? formatWon(candidate.initial_funds.post_move_liquid_assets)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>실제 월 잔여금</dt>
                <dd>
                  {candidate
                    ? formatSignedWon(
                        candidate.monthly_cash_flow.actual_monthly_balance,
                      )
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>1년 목표 달성률</dt>
                <dd>
                  {candidate?.annual_goal.annual_goal_achievement_rate ===
                    null ||
                  candidate?.annual_goal.annual_goal_achievement_rate ===
                    undefined
                    ? '—'
                    : `${candidate.annual_goal.annual_goal_achievement_rate.toLocaleString('ko-KR')}%`}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
