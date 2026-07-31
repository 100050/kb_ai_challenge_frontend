import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('서비스 목적과 3단계 이용 흐름을 안내한다', () => {
    render(<LandingPage onStart={() => undefined} />);

    expect(
      screen.getByRole('heading', {
        name: /월주거비뿐 아니라.*내 재무상태까지 함께 비교/,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('비교하세요.')).not.toBeInTheDocument();
    expect(screen.getByText('매물 2 분석 요약')).toBeInTheDocument();
    expect(screen.getByText('분석 완료')).toBeInTheDocument();
    expect(screen.getByText('가격 적정성')).toBeInTheDocument();
    expect(screen.getByText('+10.8%')).toHaveClass(
      'preview-card__value--danger',
    );
    expect(screen.getByText('유사 거래 대비')).toBeInTheDocument();
    expect(screen.getByText('+12만 원')).toHaveClass(
      'preview-card__value--success',
    );
    expect(screen.getByText('88%')).toHaveClass(
      'preview-card__value--warning',
    );
    expect(
      screen.getByText(
        '매물 2는 주변 유사 거래보다 가격 부담이 높고 월 지출 후 약 12만 원의 자금 여유가 남습니다.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('1. 소득·생활비')).toBeInTheDocument();
    expect(screen.getByText('2. 자산·재무목표')).toBeInTheDocument();
    expect(screen.getByText('3. 후보 매물·대출·비용')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '분석 결과를 챗봇에게 자세히 물어보세요',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('약 5분 소요 · 회원가입 없이 체험'),
    ).not.toBeInTheDocument();
  });

  it('분석 시작 버튼을 누르면 분석 시작을 요청한다', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(<LandingPage onStart={onStart} />);
    await user.click(
      screen.getByRole('button', { name: '무료로 분석 시작하기' }),
    );

    expect(onStart).toHaveBeenCalledOnce();
  });
});
