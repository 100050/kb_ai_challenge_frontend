import { AppHeader } from '../components/layout/AppHeader';
import {
  ArrowRightIcon,
  HomeIcon,
  TargetIcon,
  WalletIcon,
} from '../components/ui/Icons';

interface LandingPageProps {
  isStarting?: boolean;
  startError?: string;
  onStart: () => void | Promise<void>;
}

const steps = [
  {
    number: '01',
    title: '1. 소득·생활비',
    description: '월 소득과 주거비를 제외한 생활비를 입력합니다.',
    icon: WalletIcon,
  },
  {
    number: '02',
    title: '2. 자산·재무목표',
    description: '사용 가능한 자산과 지키고 싶은 목표를 입력합니다.',
    icon: TargetIcon,
  },
  {
    number: '03',
    title: '3. 후보 매물·대출·비용',
    description: '후보별 계약 조건과 필요한 비용을 함께 입력합니다.',
    icon: HomeIcon,
  },
];

export function LandingPage({
  isStarting = false,
  onStart,
  startError,
}: LandingPageProps) {
  return (
    <div className="landing-page">
      <AppHeader isStarting={isStarting} onStart={onStart} />
      <main>
        <section className="hero">
          <div className="hero__content">
            <p className="hero__eyebrow">
              <span aria-hidden="true">●</span>
              청년 맞춤 주거 의사결정 지원
            </p>
            <h1>
              청년의 집 선택,
              <br />
              월세뿐 아니라
              <br />
              내 재무상태까지 함께 비교하세요.
            </h1>
            <p className="hero__description">
              직접 찾은 후보 매물을 입력하면 초기자금, 입주 후 현금흐름과
              1년 재무목표를 분석해 현실적인 선택을 도와드립니다.
            </p>
            <button
              className="button button--primary hero__button"
              disabled={isStarting}
              onClick={onStart}
              type="button"
            >
              {isStarting ? '분석을 준비하는 중...' : '무료로 분석 시작하기'}
              <ArrowRightIcon />
            </button>
            {startError ? (
              <p className="hero__error" role="alert">
                {startError}
              </p>
            ) : null}
          </div>

          <div className="result-preview" aria-label="분석 결과 미리보기">
            <div className="result-preview__header">
              <div>
                <p className="result-preview__label">분석 결과 미리보기</p>
                <h2>매물 2 재무 분석</h2>
              </div>
              <span className="status-pill status-pill--success">모두 충족</span>
            </div>

            <div className="preview-cards">
              <article className="preview-card">
                <p>초기자금 및 유동성</p>
                <strong>3,700만 원</strong>
                <span>입주 후 유동자산</span>
              </article>
              <article className="preview-card">
                <p>월 현금흐름</p>
                <strong>+33만 원</strong>
                <span>실제 월 잔여금</span>
              </article>
              <article className="preview-card">
                <p>1년 재무목표</p>
                <strong>112%</strong>
                <span>목표 달성률</span>
              </article>
            </div>

            <div className="result-preview__note">
              <span aria-hidden="true">“</span>
              초기자금과 월 현금흐름, 1년 재무목표를 매물별로 확인하세요.
            </div>
          </div>
        </section>

        <section
          aria-labelledby="service-flow-title"
          className="service-flow"
          id="service-flow"
        >
          <div className="service-flow__heading">
            <p>이용 방법</p>
            <h2 id="service-flow-title">세 단계면 분석 준비가 끝납니다</h2>
          </div>
          <ol className="step-list">
            {steps.map(({ description, icon: Icon, number, title }) => (
              <li className="step-card" key={number}>
                <span className="step-card__number">{number}</span>
                <Icon className="step-card__icon" />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <article className="chat-service-card">
            <span aria-hidden="true">🤖</span>
            <div>
              <p>AI 상담</p>
              <h3>분석 결과를 챗봇에게 자세히 물어보세요</h3>
              <p>
                모든 후보 매물의 초기자금, 월 현금흐름, 재무목표와 가격
                적정성을 바탕으로 궁금한 점을 이어서 상담할 수 있습니다.
              </p>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
