import { HttpResponse, http } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../test/server';
import { FinancialGoalsPage } from './FinancialGoalsPage';

const analysisId = '550e8400-e29b-41d4-a716-446655440000';
const apiBaseUrl = 'http://localhost:8080/api/v1';

describe('FinancialGoalsPage', () => {
  it('독립 화면에서는 서버 요청 없이 빈 폼과 2단계 상태를 표시한다', () => {
    render(
      <FinancialGoalsPage
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: '자산과 재무목표를 입력해 주세요',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('1. 소득·생활비')).toBeInTheDocument();
    expect(screen.getByText('2. 자산·재무목표')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: '입력 진행률 67%' }),
    ).toBeInTheDocument();
  });

  it('서버에서 저장된 자산·재무목표 값을 불러온다', async () => {
    server.use(
      http.get(`${apiBaseUrl}/analyses/${analysisId}`, () =>
        HttpResponse.json({
          analysis_id: analysisId,
          status: 'draft',
          current_step: 'housing_plan',
          progress: 67,
          cash_flow: {
            after_tax_monthly_income: 3_500_000,
            monthly_living_expenses_excluding_housing_and_transport: 1_300_000,
            existing_loan_monthly_payment: 200_000,
          },
          financial_goals: {
            target_monthly_savings: 700_000,
            monthly_safety_margin: 300_000,
            available_cash: 75_000_000,
            minimum_emergency_fund: 10_000_000,
            recoverable_existing_rental_deposit: 20_000_000,
          },
          housing_plans: [],
          created_at: '2026-07-23T03:00:00Z',
          updated_at: '2026-07-23T03:20:00Z',
        }),
      ),
    );

    render(
      <FinancialGoalsPage
        analysisId={analysisId}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    expect(await screen.findByLabelText('사용 가능한 현금성 자산')).toHaveValue(
      '7500',
    );
    expect(screen.getByLabelText('반환받을 기존 임차보증금')).toHaveValue(
      '2000',
    );
    expect(screen.getByLabelText('월 목표저축액')).toHaveValue('70');
    expect(screen.getByLabelText('월 안전여유액')).toHaveValue('30');
    expect(screen.getByLabelText('최소 비상자금')).toHaveValue('1000');
    expect(screen.getAllByText('9,500만 원')).toHaveLength(2);
  });

  it('입력값을 원 단위로 변환해 서버에 저장한다', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    let requestBody: unknown;

    server.use(
      http.get(`${apiBaseUrl}/analyses/${analysisId}`, () =>
        HttpResponse.json({
          analysis_id: analysisId,
          status: 'draft',
          current_step: 'financial_goals',
          progress: 33,
          cash_flow: null,
          financial_goals: null,
          housing_plans: [],
          created_at: '2026-07-23T03:00:00Z',
          updated_at: '2026-07-23T03:00:00Z',
        }),
      ),
      http.patch(
        `${apiBaseUrl}/analyses/${analysisId}/financial-goals`,
        async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            analysis_id: analysisId,
            financial_goals: requestBody,
            current_step: 'housing_plan',
            progress: 67,
          });
        },
      ),
    );

    render(
      <FinancialGoalsPage
        analysisId={analysisId}
        onNext={onNext}
        onPrevious={() => undefined}
      />,
    );

    await user.type(
      await screen.findByLabelText('사용 가능한 현금성 자산'),
      '7500',
    );
    await user.type(screen.getByLabelText('반환받을 기존 임차보증금'), '2000');
    await user.type(screen.getByLabelText('월 목표저축액'), '70');
    await user.type(screen.getByLabelText('월 안전여유액'), '30');
    await user.type(screen.getByLabelText('최소 비상자금'), '1000');
    await user.click(screen.getByRole('button', { name: '저장하고 다음' }));

    await waitFor(() => {
      expect(requestBody).toEqual({
        target_monthly_savings: 700_000,
        monthly_safety_margin: 300_000,
        available_cash: 75_000_000,
        minimum_emergency_fund: 10_000_000,
        recoverable_existing_rental_deposit: 20_000_000,
      });
    });
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('필수 금액을 입력하지 않으면 오류를 안내한다', async () => {
    const user = userEvent.setup();

    render(
      <FinancialGoalsPage
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );
    await user.click(screen.getByRole('button', { name: '저장하고 다음' }));

    expect(screen.getAllByText('금액을 입력해 주세요.')).toHaveLength(5);
  });
});
