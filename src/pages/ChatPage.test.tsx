import { HttpResponse, http } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { server } from '../test/server';
import { ChatPage } from './ChatPage';

const analysisId = '550e8400-e29b-41d4-a716-446655440000';
const propertyId = '43b49e66-0fa2-4e0d-aee6-2f6cbc827290';
const apiBaseUrl = 'http://localhost:8080/api/v1';

function useBaseHandlers() {
  server.use(
    http.get(
      `${apiBaseUrl}/analyses/${analysisId}/chat/messages`,
      () =>
        HttpResponse.json({
          conversation_id: 'conversation-1',
          messages: [
            {
              turn_id: 'turn-1',
              user_content: '이 매물 괜찮아?',
              assistant_content:
                '현재 현금흐름 기준으로는 **안정적입니다.**\n\n- 월 잔여금 양호',
              status: 'completed',
              created_at: '2026-07-31T00:00:00Z',
            },
          ],
        }),
    ),
    http.get(`${apiBaseUrl}/analyses/${analysisId}/result`, () =>
      HttpResponse.json({
        analysis_id: analysisId,
        candidates: [
          {
            property_id: propertyId,
            name: '수정동 원룸',
            initial_funds: {
              initial_cash_required: 10_000_000,
              post_move_liquid_assets: 30_000_000,
              emergency_fund_gap: 20_000_000,
              status: 'sufficient',
            },
            monthly_cash_flow: {
              monthly_housing_and_transport_cost: 900_000,
              actual_monthly_balance: 400_000,
              monthly_budget_margin: 100_000,
              status: 'sufficient',
            },
            annual_goal: {
              annual_financial_target: 10_000_000,
              expected_resources_after_one_year: 35_000_000,
              annual_financial_surplus: 25_000_000,
              annual_goal_achievement_rate: 350,
              status: 'above_target',
            },
            price_appropriateness: {
              status: 'unavailable',
              sample_count: 0,
              comparison_mode: null,
              median_equivalent_monthly_cost: null,
              difference_from_median: null,
              difference_rate_from_median: null,
              price_percentile: null,
              candidate_equivalent_monthly_cost: null,
              samples: [],
              reason: null,
            },
            calculation_details: null,
            warnings: [],
          },
        ],
        generated_at: '2026-07-31T00:00:00Z',
      }),
    ),
    http.get(
      `${apiBaseUrl}/analyses/${analysisId}/housing-plans/${propertyId}`,
      () =>
        HttpResponse.json({
          analysis_id: analysisId,
          property_id: propertyId,
          name: '수정동 원룸',
          address: '부산시 동구 수정동',
          property_type: 'multi_family',
          legal_dong_code: null,
          exclusive_area_m2: 20,
          housing_type: 'monthly_rent',
          deposit: 10_000_000,
          monthly_rent: 700_000,
          maintenance_fee: 100_000,
          utilities: 50_000,
          transportation_cost: 50_000,
          loan_plan: null,
          additional_costs: null,
          is_complete: true,
          updated_at: '2026-07-31T00:00:00Z',
        }),
    ),
  );
}

describe('ChatPage', () => {
  it('저장된 대화와 현재 분석 요약을 불러온다', async () => {
    useBaseHandlers();

    render(
      <ChatPage
        analysisId={analysisId}
        onBack={() => undefined}
        onRestart={() => undefined}
      />,
    );

    expect(await screen.findByText('이 매물 괜찮아?')).toBeInTheDocument();
    expect(
      screen.getByText(/현재 현금흐름 기준으로는/),
    ).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('안정적입니다.').tagName).toBe('STRONG');
    expect(screen.getAllByText('수정동 원룸')).toHaveLength(2);
    expect(screen.getByText('부산시 동구 수정동')).toBeInTheDocument();
  });

  it('사용자 메시지를 보내고 SSE 답변을 증분 표시한다', async () => {
    const user = userEvent.setup();
    useBaseHandlers();
    server.use(
      http.post(
        `${apiBaseUrl}/analyses/${analysisId}/chat/messages`,
        () => {
          const body = [
            'event: message_start\ndata: {"analysis_id":"' +
              analysisId +
              '"}\n\n',
            'event: message_delta\ndata: {"content":"보증금은 "}\n\n',
            'event: message_delta\ndata: {"content":"충분합니다."}\n\n',
            'event: message_end\ndata: {"turn_id":"turn-2","role":"assistant","content":"보증금은 충분합니다.","status":"completed","created_at":"2026-07-31T00:01:00Z"}\n\n',
          ].join('');

          return new HttpResponse(body, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        },
      ),
    );

    render(
      <ChatPage
        analysisId={analysisId}
        onBack={() => undefined}
        onRestart={() => undefined}
      />,
    );

    const input = await screen.findByLabelText('메시지');
    await user.type(input, '보증금은 충분해?');
    await user.click(screen.getByRole('button', { name: '메시지 전송' }));

    expect(await screen.findByText('보증금은 충분합니다.')).toBeInTheDocument();
    expect(screen.getByText('보증금은 충분해?')).toBeInTheDocument();
  });
});
