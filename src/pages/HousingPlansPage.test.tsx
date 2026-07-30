import { HttpResponse, http } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { server } from '../test/server';
import { HousingPlansPage } from './HousingPlansPage';

const analysisId = '550e8400-e29b-41d4-a716-446655440000';
const propertyId = '43b49e66-0fa2-4e0d-aee6-2f6cbc827290';
const apiBaseUrl = 'http://localhost:8080/api/v1';

describe('HousingPlansPage', () => {
  it('독립 화면에서 후보 매물·대출·추가비용 입력을 표시한다', () => {
    render(
      <HousingPlansPage
        onExit={() => undefined}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: '후보 매물과 자금 계획을 입력해 주세요',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: '입력 진행률 100%' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('매물 이름')).toBeInTheDocument();
    expect(screen.getByLabelText('보증금 대출 예정액')).toBeInTheDocument();
    expect(screen.getByLabelText('중개보수')).toBeInTheDocument();
    expect(screen.queryByLabelText('법정동 코드')).not.toBeInTheDocument();
  });

  it('독립 화면에서 후보 매물을 추가하고 삭제한다', async () => {
    const user = userEvent.setup();

    render(
      <HousingPlansPage
        onExit={() => undefined}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /후보 매물 추가/ }),
    );
    expect(screen.getByRole('tab', { name: '매물 2' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '현재 매물 삭제' }));
    expect(
      screen.queryByRole('tab', { name: '매물 2' }),
    ).not.toBeInTheDocument();
  });

  it('분석 ID가 있으면 서버에서 매물 목록과 상세정보를 불러온다', async () => {
    server.use(
      http.get(`${apiBaseUrl}/analyses/${analysisId}/housing-plans`, () =>
        HttpResponse.json({
          housing_plans: [
            {
              property_id: propertyId,
              name: '역삼 원룸',
              housing_type: 'monthly_rent',
              is_complete: true,
              updated_at: '2026-07-23T03:25:00Z',
            },
          ],
        }),
      ),
      http.get(
        `${apiBaseUrl}/analyses/${analysisId}/housing-plans/${propertyId}`,
        () =>
          HttpResponse.json({
            analysis_id: analysisId,
            property_id: propertyId,
            name: '역삼 원룸',
            address: '서울특별시 강남구 역삼동',
            property_type: 'officetel',
            legal_dong_code: '1168010100',
            exclusive_area_m2: 20,
            housing_type: 'monthly_rent',
            deposit: 10_000_000,
            monthly_rent: 700_000,
            maintenance_fee: 100_000,
            utilities: 50_000,
            transportation_cost: 80_000,
            loan_plan: {
              deposit_loan_amount: 0,
              annual_interest_rate: 0,
            },
            additional_costs: {
              brokerage_fee: 300_000,
              moving_cost: 1_000_000,
              other_move_in_cost: 300_000,
            },
            is_complete: true,
            created_at: '2026-07-23T03:21:00Z',
            updated_at: '2026-07-23T03:25:00Z',
          }),
      ),
    );

    render(
      <HousingPlansPage
        analysisId={analysisId}
        onExit={() => undefined}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    expect(await screen.findByLabelText('매물 이름')).toHaveValue('역삼 원룸');
    expect(screen.getByLabelText('주소')).toHaveValue(
      '서울특별시 강남구 역삼동',
    );
    expect(screen.getByLabelText('보증금')).toHaveValue('1000');
    expect(screen.getByLabelText('월세')).toHaveValue('70');
  });
});
