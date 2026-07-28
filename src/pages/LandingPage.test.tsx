import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('서비스 목적과 3단계 이용 흐름을 안내한다', () => {
    render(<LandingPage onStart={() => undefined} />);

    expect(
      screen.getByRole('heading', {
        name: /월세뿐 아니라.*내 재무상태까지 함께 비교하세요/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('1. 소득·생활비')).toBeInTheDocument();
    expect(screen.getByText('2. 자산·재무목표')).toBeInTheDocument();
    expect(screen.getByText('3. 후보 매물·대출·비용')).toBeInTheDocument();
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
