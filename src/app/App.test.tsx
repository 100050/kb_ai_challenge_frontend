import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('분석 시작 버튼을 누르면 서버 요청 없이 소득·생활비 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/');

    render(<App />);
    await user.click(
      screen.getByRole('button', { name: '무료로 분석 시작하기' }),
    );

    expect(
      screen.getByRole('heading', {
        name: '소득과 생활비를 입력해 주세요',
      }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/cash-flow');
  });

  it('자산·재무목표 독립 경로를 표시하고 이전 버튼으로 1단계에 이동한다', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/financial-goals');

    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: '자산과 재무목표를 입력해 주세요',
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '이전' }));

    expect(
      screen.getByRole('heading', {
        name: '소득과 생활비를 입력해 주세요',
      }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/cash-flow');
  });

  it('입력 화면에서 나가기를 누르면 메인 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/financial-goals');

    render(<App />);
    await user.click(screen.getByRole('button', { name: '나가기' }));

    expect(
      screen.getByRole('heading', {
        name: /월세뿐 아니라.*내 재무상태까지 함께 비교하세요/,
      }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('후보 매물 독립 경로를 표시한다', () => {
    window.history.replaceState({}, '', '/housing-plans');

    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: '후보 매물과 자금 계획을 입력해 주세요',
      }),
    ).toBeInTheDocument();
  });

  it('최종 결과 독립 경로를 표시한다', () => {
    window.history.replaceState({}, '', '/results');

    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: '매물별 분석 결과를 확인하세요',
      }),
    ).toBeInTheDocument();
  });
});
