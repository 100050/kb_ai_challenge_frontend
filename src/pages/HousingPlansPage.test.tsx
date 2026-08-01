import { HttpResponse, http } from 'msw';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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
      screen.getByRole('progressbar', { name: '입력 진행률 3/3' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('매물 이름')).toBeInTheDocument();
    expect(screen.getByLabelText('매물 메모 (선택)')).toBeInTheDocument();
    expect(screen.getByText('0 / 2,000자')).toBeInTheDocument();
    expect(screen.getByLabelText('시/도')).toBeInTheDocument();
    expect(screen.getByLabelText('시/군/구')).toBeInTheDocument();
    expect(screen.getByLabelText('읍/면/동')).toBeInTheDocument();
    expect(screen.getByLabelText('보증금 대출 예정액')).toBeInTheDocument();
    expect(screen.getByLabelText('중개보수')).toBeInTheDocument();
    expect(screen.queryByLabelText('법정동 코드')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '매물 기본정보' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '매물 세부정보' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '보증금 대출' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '초기 입주비용' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '매물 기타 정보' })).not.toBeInTheDocument();
  });

  it('주택 유형을 4개의 결합 항목으로 표시한다', () => {
    render(
      <HousingPlansPage
        onExit={() => undefined}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    const options = within(screen.getByLabelText('주택 유형'))
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(options).toEqual([
      '선택해 주세요',
      '아파트',
      '연립·다세대',
      '오피스텔',
      '단독·다가구',
    ]);
    expect(options[0]).toBe('선택해 주세요');
    expect(
      within(screen.getByLabelText('주택 유형')).getByRole('option', {
        name: '선택해 주세요',
      }),
    ).toBeDisabled();
    expect(
      within(screen.getByLabelText('계약 유형')).getByRole('option', {
        name: '선택해 주세요',
      }),
    ).toBeDisabled();
  });

  it('면적을 평수로 환산하고 대출 선택 시에만 입력을 활성화한다', async () => {
    const user = userEvent.setup();
    render(
      <HousingPlansPage
        onExit={() => undefined}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    const loanAmount = screen.getByLabelText('보증금 대출 예정액');
    const interestRate = screen.getByLabelText('연이자율(%)');
    expect(loanAmount).toBeDisabled();
    expect(interestRate).toBeDisabled();

    await user.type(screen.getByLabelText('전용면적(㎡)'), '33.058');
    expect(screen.getByText('약 10.0평')).toBeInTheDocument();
    expect(
      screen.getByText(/^만기일시상환 기준으로/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: '대출 이용' }));
    expect(loanAmount).toBeEnabled();
    expect(interestRate).toBeEnabled();
  });

  it('전세를 선택하면 전세보증금 입력 방법을 안내한다', async () => {
    const user = userEvent.setup();
    render(
      <HousingPlansPage
        onExit={() => undefined}
        onNext={() => undefined}
        onPrevious={() => undefined}
      />,
    );

    await user.selectOptions(screen.getByLabelText('계약 유형'), 'jeonse');

    expect(screen.getByLabelText('전세보증금')).toBeInTheDocument();
    expect(screen.getByLabelText('월세')).toBeDisabled();
    expect(
      screen.getByText(
        '전세 계약은 전체 전세금을 ‘전세보증금’에 입력해 주세요. 월세는 0원으로 처리됩니다.',
      ),
    ).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: '매물 2 삭제' }));
    expect(
      screen.queryByRole('tab', { name: '매물 2' }),
    ).not.toBeInTheDocument();
  });

  it('분석 ID가 있으면 서버에서 매물 목록과 상세정보를 불러온다', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    let requestBody: Record<string, unknown> | undefined;
    const savedPlan = {
      analysis_id: analysisId,
      property_id: propertyId,
      name: '역삼 원룸',
      memo: '역세권, 엘리베이터 있음',
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
    };
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
        () => HttpResponse.json(savedPlan),
      ),
      http.patch(
        `${apiBaseUrl}/analyses/${analysisId}/housing-plans/${propertyId}`,
        async ({ request }) => {
          requestBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(savedPlan);
        },
      ),
      http.post(`${apiBaseUrl}/analyses/${analysisId}/evaluation`, () =>
        HttpResponse.json({ analysis_id: analysisId, status: 'evaluating' }),
      ),
    );

    render(
      <HousingPlansPage
        analysisId={analysisId}
        onExit={() => undefined}
        onNext={onNext}
        onPrevious={() => undefined}
      />,
    );

    expect(await screen.findByLabelText('매물 이름')).toHaveValue('역삼 원룸');
    expect(screen.getByLabelText('매물 메모 (선택)')).toHaveValue(
      '역세권, 엘리베이터 있음',
    );
    expect(screen.getByLabelText('시/도')).toHaveValue('서울특별시');
    expect(screen.getByLabelText('시/군/구')).toHaveValue('강남구');
    expect(screen.getByLabelText('읍/면/동')).toHaveValue('역삼동');
    expect(screen.getByLabelText('보증금')).toHaveValue('1,000');
    expect(screen.getByLabelText('월세')).toHaveValue('70');
    expect(screen.getByRole('checkbox', { name: '대출 이용' })).not.toBeChecked();

    await user.click(
      screen.getByRole('button', { name: /분석하기/ }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      '분석 결과를 만드는 중입니다.',
    );
    expect(
      screen.queryByRole('complementary', { name: '분석 입력 단계' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('분석 중...')).toBeInTheDocument();
    expect(screen.queryByText('저장 중...')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(requestBody?.loan_plan).toEqual({
        deposit_loan_amount: 0,
        annual_interest_rate: 0,
      });
      expect(requestBody?.memo).toBe('역세권, 엘리베이터 있음');
    });
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('저장된 매물이 없으면 서버에 첫 매물 초안을 만들고 입력 폼을 표시한다', async () => {
    server.use(
      http.get(`${apiBaseUrl}/analyses/${analysisId}/housing-plans`, () =>
        HttpResponse.json({ housing_plans: [] }),
      ),
      http.post(
        `${apiBaseUrl}/analyses/${analysisId}/housing-plans`,
        () =>
          HttpResponse.json(
            {
              analysis_id: analysisId,
              property_id: propertyId,
              name: null,
              address: null,
              property_type: null,
              legal_dong_code: null,
              exclusive_area_m2: null,
              housing_type: null,
              deposit: null,
              monthly_rent: null,
              maintenance_fee: null,
              utilities: null,
              transportation_cost: null,
              loan_plan: null,
              additional_costs: null,
              is_complete: false,
              created_at: '2026-07-23T03:21:00Z',
              updated_at: '2026-07-23T03:21:00Z',
            },
            { status: 201 },
          ),
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

    expect(await screen.findByLabelText('매물 이름')).toHaveValue('');
    expect(screen.getByRole('tab', { name: '매물 1' })).toBeInTheDocument();
  });
});
