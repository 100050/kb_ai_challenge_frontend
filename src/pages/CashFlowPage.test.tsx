import { HttpResponse, http } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../test/server';
import { CashFlowPage } from './CashFlowPage';

const analysisId = '550e8400-e29b-41d4-a716-446655440000';
const apiBaseUrl = 'http://localhost:8080/api/v1';

describe('CashFlowPage', () => {
  it('서버에서 저장된 소득·생활비 값을 불러온다', async () => {
    server.use(
      http.get(`${apiBaseUrl}/analyses/${analysisId}`, () =>
        HttpResponse.json({
          analysis_id: analysisId,
          status: 'draft',
          current_step: 'financial_goals',
          progress: 33,
          cash_flow: {
            after_tax_monthly_income: 3_500_000,
            monthly_living_expenses_excluding_housing_and_transport: 1_300_000,
            existing_loan_monthly_payment: 200_000,
          },
          financial_goals: null,
          housing_plans: [],
          created_at: '2026-07-23T03:00:00Z',
          updated_at: '2026-07-23T03:20:00Z',
        }),
      ),
    );

    render(
      <CashFlowPage
        analysisId={analysisId}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    expect(await screen.findByLabelText('세후 월 소득')).toHaveValue('350');
    expect(screen.getByLabelText('월 생활비')).toHaveValue('130');
    expect(screen.getByLabelText('기존 대출 월 상환액')).toHaveValue('20');
  });

  it('임시 저장된 필드만 채우고 저장되지 않은 필드는 빈칸으로 둔다', async () => {
    server.use(
      http.get(`${apiBaseUrl}/analyses/${analysisId}`, () =>
        HttpResponse.json({
          analysis_id: analysisId,
          status: 'draft',
          current_step: 'cash_flow',
          progress: 0,
          cash_flow: {
            after_tax_monthly_income: 3_500_000,
            monthly_living_expenses_excluding_housing_and_transport: null,
            existing_loan_monthly_payment: null,
          },
          financial_goals: null,
          housing_plans: [],
          created_at: '2026-07-23T03:00:00Z',
          updated_at: '2026-07-23T03:20:00Z',
        }),
      ),
    );

    render(
      <CashFlowPage
        analysisId={analysisId}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    expect(await screen.findByLabelText('세후 월 소득')).toHaveValue('350');
    expect(screen.getByLabelText('월 생활비')).toHaveValue('');
    expect(screen.getByLabelText('기존 대출 월 상환액')).toHaveValue('');
  });

  it('입력값을 원 단위로 변환해 서버에 저장하고 다음 단계로 이동한다', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    let requestBody: unknown;

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
          created_at: '2026-07-23T03:00:00Z',
          updated_at: '2026-07-23T03:00:00Z',
        }),
      ),
      http.patch(
        `${apiBaseUrl}/analyses/${analysisId}/cash-flow`,
        async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            analysis_id: analysisId,
            cash_flow: requestBody,
            current_step: 'financial_goals',
            progress: 33,
          });
        },
      ),
    );

    render(
      <CashFlowPage
        analysisId={analysisId}
        onNext={onNext}
        onPrevious={() => undefined}
      />,
    );

    await user.type(await screen.findByLabelText('세후 월 소득'), '350');
    await user.type(screen.getByLabelText('월 생활비'), '130');
    await user.type(screen.getByLabelText('기존 대출 월 상환액'), '20');
    await user.click(screen.getByRole('button', { name: '저장하고 다음' }));

    await waitFor(() => {
      expect(requestBody).toEqual({
        after_tax_monthly_income: 3_500_000,
        monthly_living_expenses_excluding_housing_and_transport: 1_300_000,
        existing_loan_monthly_payment: 200_000,
      });
    });
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('필수 금액을 입력하지 않으면 저장하지 않고 오류를 안내한다', async () => {
    const user = userEvent.setup();

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
          created_at: '2026-07-23T03:00:00Z',
          updated_at: '2026-07-23T03:00:00Z',
        }),
      ),
    );

    render(
      <CashFlowPage
        analysisId={analysisId}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    await screen.findByLabelText('세후 월 소득');
    await user.click(screen.getByRole('button', { name: '저장하고 다음' }));

    expect(screen.getAllByText('금액을 입력해 주세요.')).toHaveLength(3);
  });

  it('작성한 필드만 서버에 임시 저장하고 화면에 머문다', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    let requestBody: unknown;

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
          created_at: '2026-07-23T03:00:00Z',
          updated_at: '2026-07-23T03:00:00Z',
        }),
      ),
      http.patch(
        `${apiBaseUrl}/analyses/${analysisId}/cash-flow`,
        async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            analysis_id: analysisId,
            cash_flow: requestBody,
            current_step: 'financial_goals',
            progress: 33,
          });
        },
      ),
    );

    render(
      <CashFlowPage
        analysisId={analysisId}
        onNext={onNext}
        onPrevious={() => undefined}
      />,
    );

    await user.type(await screen.findByLabelText('세후 월 소득'), '350');
    await user.click(screen.getByRole('button', { name: '임시 저장' }));

    expect(
      await screen.findByText('지금까지 입력한 내용을 저장했습니다.'),
    ).toBeInTheDocument();
    expect(requestBody).toEqual({
      after_tax_monthly_income: 3_500_000,
    });
    expect(onNext).not.toHaveBeenCalled();
  });
});
