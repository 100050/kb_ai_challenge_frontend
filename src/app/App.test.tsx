import { HttpResponse, http } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { server } from '../test/server';

const analysisId = '550e8400-e29b-41d4-a716-446655440000';
const apiBaseUrl = 'http://localhost:8080/api/v1';

describe('App', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
  });

  it('분석 시작 시 서버에서 분석 ID를 발급받아 저장하고 해당 입력 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/');
    server.use(
      http.post(`${apiBaseUrl}/analyses`, () =>
        HttpResponse.json(
          {
            analysis_id: analysisId,
            status: 'draft',
            current_step: 'cash_flow',
            progress: 0,
            created_at: '2026-07-30T00:00:00Z',
          },
          { status: 201 },
        ),
      ),
      http.get(`${apiBaseUrl}/analyses/${analysisId}`, () =>
        HttpResponse.json({
          analysis_id: analysisId,
          status: 'draft',
          current_step: 'cash_flow',
          progress: 0,
          cash_flow: null,
          financial_goals: null,
          housing_plans: [],
          created_at: '2026-07-30T00:00:00Z',
          updated_at: '2026-07-30T00:00:00Z',
        }),
      ),
    );

    render(<App />);
    await user.click(
      screen.getByRole('button', { name: '무료로 분석 시작하기' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: '소득과 생활비를 입력해 주세요',
      }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe(
      `/analyses/${analysisId}/cash-flow`,
    );
    expect(window.localStorage.getItem('kb-housing-ai.analysis-id')).toBe(
      analysisId,
    );
  });

  it('저장된 분석 ID가 있으면 새 분석을 생성하지 않고 이어서 시작한다', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/');
    window.localStorage.setItem('kb-housing-ai.analysis-id', analysisId);

    server.use(
      http.get(`${apiBaseUrl}/analyses/${analysisId}`, () =>
        HttpResponse.json({
          analysis_id: analysisId,
          status: 'draft',
          current_step: 'cash_flow',
          progress: 0,
          cash_flow: null,
          financial_goals: null,
          housing_plans: [],
          created_at: '2026-07-30T00:00:00Z',
          updated_at: '2026-07-30T00:00:00Z',
        }),
      ),
    );

    render(<App />);
    await user.click(
      screen.getByRole('button', { name: '무료로 분석 시작하기' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: '소득과 생활비를 입력해 주세요',
      }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe(
      `/analyses/${analysisId}/cash-flow`,
    );
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
