import { HttpResponse, http } from 'msw';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { server } from '../test/server';
import { ResultsPage } from './ResultsPage';

const analysisId = '550e8400-e29b-41d4-a716-446655440000';
const apiBaseUrl = 'http://localhost:8080/api/v1';

describe('ResultsPage', () => {
  it('독립 결과 화면에서 가격 그래프와 비교 불가 표본을 전환해 확인한다', async () => {
    const user = userEvent.setup();
    render(<ResultsPage onExit={() => undefined} onPrevious={() => undefined} />);

    expect(
      screen.getByRole('heading', { name: '가격 적정성 분석' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '재무 적정성 분석' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'AI 종합 해설' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('complementary', { name: '분석 입력 단계' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '초기자금 및 유동성' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '월 현금흐름' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '1년 재무목표' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('추천 매물')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '가격 적정성 분석' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('figure', {
        name: /비교군 중앙값.*현재 매물/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('128개')).toBeInTheDocument();
    expect(screen.getByText('역세권, 엘리베이터 있음')).toBeInTheDocument();

    const priceTabs = screen.getByRole('tablist', {
      name: '가격 분석 매물 선택',
    });
    await user.click(within(priceTabs).getByRole('tab', { name: '매물 2' }));

    expect(screen.queryByText('매물 메모')).not.toBeInTheDocument();
    expect(
      screen.getByText('가격 비교 결과를 제공할 수 없습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('가격 비교에 필요한 매물 정보가 부족합니다.'),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/비교 표본 수: 0개/)).toBeInTheDocument();

    await user.click(within(priceTabs).getByRole('tab', { name: '매물 3' }));

    expect(screen.getByText('채광 좋음')).toBeInTheDocument();

    const table = screen.getByRole('table', {
      name: '전체 실거래 표본 3개',
    });
    expect(screen.getAllByText('부산시 동구 수정동')).toHaveLength(2);
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(within(table).getByText('내 매물')).toBeInTheDocument();
    expect(within(table).getByText('매물 3')).toBeInTheDocument();
    expect(within(table).getByText('수정 아파트 A')).toBeInTheDocument();
    expect(within(table).getByText('84.5만 원')).toBeInTheDocument();
    const candidateRow = within(table).getByText('매물 3').closest('tr');
    expect(candidateRow).not.toBeNull();
    expect(
      within(candidateRow!).queryByText('2026-07-02'),
    ).not.toBeInTheDocument();
    expect(within(candidateRow!).getByText('—')).toBeInTheDocument();

    const depositSort = within(table).getByRole('button', {
      name: /보증금/,
    });
    await user.click(depositSort);
    expect(depositSort.closest('th')).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
      '수정 아파트 A',
    );
    await user.click(depositSort);
    expect(depositSort.closest('th')).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
      '수정 빌라 B',
    );

    await user.click(within(priceTabs).getByRole('tab', { name: '매물 1' }));
    expect(
      screen.getByRole('figure', {
        name: /비교군 중앙값.*현재 매물/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('128개')).toBeInTheDocument();
  });

  it('서버 결과를 원화 형식으로 표시하고 초기자금 부족 경고를 우선한다', async () => {
    server.use(
      http.get(`${apiBaseUrl}/analyses/${analysisId}/result`, () =>
        HttpResponse.json({
          analysis_id: analysisId,
          candidates: [
            {
              property_id: '43b49e66-0fa2-4e0d-aee6-2f6cbc827290',
              name: '역삼 원룸',
              initial_funds: {
                available_cash: 75_000_000,
                initial_cash_required: 86_000_000,
                post_move_liquid_assets: -11_000_000,
                emergency_fund_gap: -21_000_000,
                status: 'insufficient_initial_funds',
              },
              monthly_cash_flow: {
                monthly_housing_and_transport_cost: 930_000,
                essential_monthly_outflow: 2_430_000,
                actual_monthly_balance: 370_000,
                monthly_budget_margin: 70_000,
                status: 'sufficient',
              },
              annual_goal: {
                annual_financial_target: 18_400_000,
                expected_resources_after_one_year: 96_240_000,
                annual_financial_surplus: 77_840_000,
                annual_goal_achievement_rate: 523.04,
                status: 'above_target',
              },
              price_appropriateness: {
                status: 'unavailable',
                comparison_mode: null,
                median_equivalent_monthly_cost: null,
                difference_from_median: null,
                difference_rate_from_median: null,
                price_percentile: null,
                candidate_equivalent_monthly_cost: null,
                sample_count: 0,
                samples: [],
                reason: '비교 필드가 없습니다.',
              },
              calculation_details: {},
              warnings: [
                {
                  code: 'INSUFFICIENT_INITIAL_FUNDS',
                  message:
                    '초기자금이 부족하여 이후 계산은 계약 체결을 가정한 참고값입니다.',
                },
              ],
            },
          ],
          generated_at: '2026-07-24T03:31:00Z',
        }),
      ),
      http.get(`${apiBaseUrl}/analyses/${analysisId}`, () =>
        HttpResponse.json({
          analysis_id: analysisId,
          status: 'completed',
          current_step: 'confirmation',
          progress: 100,
          cash_flow: {
            after_tax_monthly_income: 3_500_000,
            monthly_living_expenses_excluding_housing_and_transport: 1_300_000,
            existing_loan_monthly_payment: 200_000,
          },
          financial_goals: null,
          housing_plans: [],
          created_at: '2026-07-23T03:00:00Z',
          updated_at: '2026-07-24T03:31:00Z',
        }),
      ),
      http.get(
        `${apiBaseUrl}/analyses/${analysisId}/housing-plans/43b49e66-0fa2-4e0d-aee6-2f6cbc827290`,
        () =>
          HttpResponse.json({
            analysis_id: analysisId,
            property_id: '43b49e66-0fa2-4e0d-aee6-2f6cbc827290',
            name: '역삼 원룸',
            address: '서울특별시 강남구 역삼동',
            property_type: 'officetel',
            legal_dong_code: null,
            exclusive_area_m2: 20,
            housing_type: 'monthly_rent',
            deposit: 10_000_000,
            monthly_rent: 700_000,
            maintenance_fee: 100_000,
            utilities: 50_000,
            transportation_cost: 80_000,
            loan_plan: null,
            additional_costs: null,
            is_complete: true,
            created_at: '2026-07-23T03:21:00Z',
            updated_at: '2026-07-23T03:25:00Z',
          }),
      ),
    );

    render(
      <ResultsPage
        analysisId={analysisId}
        onExit={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    expect(await screen.findAllByText('역삼 원룸')).toHaveLength(3);
    expect(screen.getAllByText('초기자금 부족').length).toBeGreaterThan(0);
    expect(screen.getByText('목표 달성')).toBeInTheDocument();
    expect(screen.queryByText('목표 초과')).not.toBeInTheDocument();
    expect(screen.getByText('8,600만 원')).toBeInTheDocument();
    expect(screen.getByText('사용 가능 현금')).toBeInTheDocument();
    expect(screen.getByText('7,500만 원')).toBeInTheDocument();
    expect(screen.getByText('월 수익')).toBeInTheDocument();
    expect(screen.getByText('350만 원')).toBeInTheDocument();
    expect(screen.getByText('필수 월 현금유출')).toBeInTheDocument();
    expect(screen.getByText('243만 원')).toBeInTheDocument();
    expect(screen.queryByText('월 주거·교통비')).not.toBeInTheDocument();
    expect(screen.getByText('-1,100만 원')).toHaveClass(
      'result-metric__value--negative',
    );
    expect(screen.getByText('-2,100만 원')).toHaveClass(
      'result-metric__value--negative',
    );
    expect(
      screen.getByText(/계약이 체결된다는 가정으로 계산한 참고값/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '초기자금이 부족하여 이후 계산은 계약 체결을 가정한 참고값입니다.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('가격 비교 결과를 제공할 수 없습니다.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('비교 필드가 없습니다.')).not.toBeInTheDocument();
  });
});
