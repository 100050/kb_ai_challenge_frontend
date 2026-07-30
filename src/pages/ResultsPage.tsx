import { useEffect, useMemo, useState } from 'react';

import { ApiError } from '../api/httpClient';
import { AnalysisHeader } from '../components/layout/AnalysisHeader';
import { StepSidebar } from '../components/layout/StepSidebar';
import { HomeIcon, TargetIcon, WalletIcon } from '../components/ui/Icons';
import { getAnalysisResult } from '../features/analysis/api/analysisApi';
import type {
  AnalysisCandidateResult,
  AnalysisResult,
  AnnualGoalStatus,
  InitialFundsStatus,
  MonthlyCashFlowStatus,
  PriceComparisonSample,
} from '../features/analysis/model/analysisTypes';

interface ResultsPageProps {
  analysisId?: string;
  onExit: () => void;
  onPrevious: () => void;
}

type ResultTone = 'success' | 'warning' | 'danger';

interface StatusPresentation {
  label: string;
  tone: ResultTone;
}

const initialFundsStatus: Record<InitialFundsStatus, StatusPresentation> = {
  insufficient_initial_funds: {
    label: '초기자금 부족',
    tone: 'danger',
  },
  emergency_fund_shortfall: {
    label: '비상자금 미달',
    tone: 'warning',
  },
  sufficient: { label: '모두 충족', tone: 'success' },
};

const monthlyCashFlowStatus: Record<
  MonthlyCashFlowStatus,
  StatusPresentation
> = {
  essential_expense_deficit: {
    label: '필수생활 적자',
    tone: 'danger',
  },
  savings_target_shortfall: {
    label: '목표저축 미달',
    tone: 'warning',
  },
  safety_margin_shortfall: {
    label: '안전여유 미달',
    tone: 'warning',
  },
  sufficient: { label: '모두 충족', tone: 'success' },
};

const annualGoalStatus: Record<AnnualGoalStatus, StatusPresentation> = {
  below_target: { label: '목표 미달', tone: 'warning' },
  target_met: { label: '목표 달성', tone: 'success' },
  above_target: { label: '목표 초과', tone: 'success' },
};

const previewResult: AnalysisResult = {
  analysis_id: 'preview',
  candidates: [
    {
      property_id: 'preview-property-1',
      name: '매물 1',
      initial_funds: {
        initial_cash_required: 11_600_000,
        post_move_liquid_assets: 83_400_000,
        emergency_fund_gap: 73_400_000,
        status: 'sufficient',
      },
      monthly_cash_flow: {
        monthly_housing_and_transport_cost: 930_000,
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
        status: 'available',
        sample_count: 128,
        comparison_mode: 'median',
        median_equivalent_monthly_cost: 880_000,
        difference_from_median: 50_000,
        difference_rate_from_median: 5.68,
        price_percentile: 72.2,
        samples: [],
        reason: null,
      },
      calculation_details: null,
      warnings: [],
    },
    {
      property_id: 'preview-property-2',
      name: '매물 2',
      initial_funds: {
        initial_cash_required: 88_000_000,
        post_move_liquid_assets: 7_000_000,
        emergency_fund_gap: -3_000_000,
        status: 'emergency_fund_shortfall',
      },
      monthly_cash_flow: {
        monthly_housing_and_transport_cost: 1_150_000,
        actual_monthly_balance: 150_000,
        monthly_budget_margin: -150_000,
        status: 'savings_target_shortfall',
      },
      annual_goal: {
        annual_financial_target: 18_400_000,
        expected_resources_after_one_year: 85_800_000,
        annual_financial_surplus: 67_400_000,
        annual_goal_achievement_rate: 466.3,
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
        samples: [],
        reason: '가격 비교에 필요한 매물 정보가 부족합니다.',
      },
      calculation_details: null,
      warnings: [],
    },
    {
      property_id: 'preview-property-3',
      name: '매물 3',
      initial_funds: {
        initial_cash_required: 25_000_000,
        post_move_liquid_assets: 70_000_000,
        emergency_fund_gap: 60_000_000,
        status: 'sufficient',
      },
      monthly_cash_flow: {
        monthly_housing_and_transport_cost: 980_000,
        actual_monthly_balance: 320_000,
        monthly_budget_margin: 20_000,
        status: 'sufficient',
      },
      annual_goal: {
        annual_financial_target: 18_400_000,
        expected_resources_after_one_year: 94_000_000,
        annual_financial_surplus: 75_600_000,
        annual_goal_achievement_rate: 510.87,
        status: 'above_target',
      },
      price_appropriateness: {
        status: 'available',
        sample_count: 3,
        comparison_mode: 'individual_samples',
        median_equivalent_monthly_cost: null,
        difference_from_median: null,
        difference_rate_from_median: null,
        price_percentile: null,
        samples: [
          {
            deposit: 10_000_000,
            monthly_rent: 700_000,
            exclusive_area_m2: 58,
            contract_date: '2026-07-01',
            equivalent_monthly_cost: 741_667,
          },
          {
            deposit: 20_000_000,
            monthly_rent: 800_000,
            exclusive_area_m2: 62,
            contract_date: '2026-07-02',
            equivalent_monthly_cost: 883_333,
          },
          {
            deposit: 15_000_000,
            monthly_rent: 750_000,
            exclusive_area_m2: 60,
            contract_date: '2026-06-18',
            equivalent_monthly_cost: 812_500,
          },
        ],
        reason: null,
      },
      calculation_details: null,
      warnings: [],
    },
  ],
  generated_at: '2026-07-29T00:00:00Z',
};

function formatWon(value: number) {
  const manwon = value / 10_000;
  return `${manwon.toLocaleString('ko-KR', {
    maximumFractionDigits: 1,
  })}만 원`;
}

function formatSignedWon(value: number) {
  if (value === 0) {
    return '0만 원';
  }

  return `${value > 0 ? '+' : ''}${formatWon(value)}`;
}

function getPriority(candidate: AnalysisCandidateResult): StatusPresentation {
  const initial = initialFundsStatus[candidate.initial_funds.status];
  if (candidate.initial_funds.status !== 'sufficient') {
    return initial;
  }

  const monthly = monthlyCashFlowStatus[candidate.monthly_cash_flow.status];
  if (candidate.monthly_cash_flow.status !== 'sufficient') {
    return monthly;
  }

  return annualGoalStatus[candidate.annual_goal.status];
}

interface PriceComparisonChartProps {
  candidateCost: number;
  medianCost: number;
}

function PriceComparisonChart({
  candidateCost,
  medianCost,
}: PriceComparisonChartProps) {
  const scaleMax = Math.max(candidateCost, medianCost, 1) * 1.12;
  const medianWidth = `${(medianCost / scaleMax) * 100}%`;
  const candidateWidth = `${(candidateCost / scaleMax) * 100}%`;

  return (
    <figure
      aria-label={`비교군 중앙값 ${formatWon(medianCost)}, 현재 매물 ${formatWon(candidateCost)}`}
      className="price-chart"
    >
      <figcaption>환산 월 임대비용 비교</figcaption>
      <div className="price-chart__row">
        <div className="price-chart__label">
          <span>비교군 중앙값</span>
          <strong>{formatWon(medianCost)}</strong>
        </div>
        <div className="price-chart__track">
          <span
            className="price-chart__bar price-chart__bar--median"
            style={{ width: medianWidth }}
          />
        </div>
      </div>
      <div className="price-chart__row">
        <div className="price-chart__label">
          <span>현재 매물</span>
          <strong>{formatWon(candidateCost)}</strong>
        </div>
        <div className="price-chart__track">
          <span
            className="price-chart__bar price-chart__bar--candidate"
            style={{ width: candidateWidth }}
          />
        </div>
      </div>
    </figure>
  );
}

type SampleSortKey = keyof PriceComparisonSample;
type SortDirection = 'ascending' | 'descending';

const sampleColumns: {
  key: SampleSortKey;
  label: string;
}[] = [
  { key: 'deposit', label: '보증금' },
  { key: 'monthly_rent', label: '월세' },
  { key: 'exclusive_area_m2', label: '전용면적' },
  { key: 'contract_date', label: '계약일' },
  { key: 'equivalent_monthly_cost', label: '환산 월 임대비용' },
];

interface PriceSampleTableProps {
  samples: PriceComparisonSample[];
}

function PriceSampleTable({ samples }: PriceSampleTableProps) {
  const [sortKey, setSortKey] =
    useState<SampleSortKey>('equivalent_monthly_cost');
  const [direction, setDirection] = useState<SortDirection>('ascending');

  const sortedSamples = useMemo(() => {
    const multiplier = direction === 'ascending' ? 1 : -1;

    return [...samples].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (typeof leftValue === 'string' && typeof rightValue === 'string') {
        return leftValue.localeCompare(rightValue) * multiplier;
      }

      return (Number(leftValue) - Number(rightValue)) * multiplier;
    });
  }, [direction, samples, sortKey]);

  const changeSort = (key: SampleSortKey) => {
    if (key === sortKey) {
      setDirection((current) =>
        current === 'ascending' ? 'descending' : 'ascending',
      );
      return;
    }

    setSortKey(key);
    setDirection('ascending');
  };

  return (
    <div className="sample-table-wrap">
      <table className="sample-table">
        <caption>
          전체 실거래 표본 {samples.length}개
        </caption>
        <thead>
          <tr>
            {sampleColumns.map((column) => (
              <th
                aria-sort={column.key === sortKey ? direction : 'none'}
                key={column.key}
                scope="col"
              >
                <button onClick={() => changeSort(column.key)} type="button">
                  {column.label}
                  <span aria-hidden="true">
                    {column.key === sortKey
                      ? direction === 'ascending'
                        ? '↑'
                        : '↓'
                      : '↕'}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedSamples.map((sample) => (
            <tr
              key={`${sample.contract_date}-${sample.deposit}-${sample.monthly_rent}`}
            >
              <td>{formatWon(sample.deposit)}</td>
              <td>{formatWon(sample.monthly_rent)}</td>
              <td>{sample.exclusive_area_m2.toLocaleString('ko-KR')}㎡</td>
              <td>{sample.contract_date}</td>
              <td>{formatWon(sample.equivalent_monthly_cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="result-metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

interface ResultCardProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  status: StatusPresentation;
  title: string;
}

function ResultCard({
  children,
  icon,
  status,
  title,
}: ResultCardProps) {
  return (
    <article className={`result-card result-card--${status.tone}`}>
      <div className="result-card__header">
        <div>
          {icon}
          <h2>{title}</h2>
        </div>
        <span className={`result-status result-status--${status.tone}`}>
          {status.label}
        </span>
      </div>
      <dl>{children}</dl>
    </article>
  );
}

export function ResultsPage({
  analysisId,
  onExit,
  onPrevious,
}: ResultsPageProps) {
  const [result, setResult] = useState<AnalysisResult | null>(
    analysisId ? null : previewResult,
  );
  const [activeId, setActiveId] = useState(
    analysisId ? '' : previewResult.candidates[0].property_id,
  );
  const [isLoading, setIsLoading] = useState(Boolean(analysisId));
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!analysisId) {
      return;
    }

    const controller = new AbortController();
    getAnalysisResult(analysisId, controller.signal)
      .then((response) => {
        setResult(response);
        setActiveId(response.candidates[0]?.property_id ?? '');
      })
      .catch((loadError: unknown) => {
        if (
          loadError instanceof DOMException &&
          loadError.name === 'AbortError'
        ) {
          return;
        }
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : '분석 결과를 불러오지 못했습니다.',
        );
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [analysisId, reloadKey]);

  const activeCandidate = useMemo(
    () =>
      result?.candidates.find(
        (candidate) => candidate.property_id === activeId,
      ),
    [activeId, result],
  );

  const retryLoad = () => {
    setIsLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="analysis-page">
      <AnalysisHeader
        onExit={onExit}
        saveStatus={analysisId ? '분석 완료' : '결과 화면 미리보기'}
      />
      <div className="analysis-shell">
        <StepSidebar currentStep={4} progress={100} />
        <main className="analysis-content result-page">
          {isLoading ? (
            <div className="page-state" role="status">
              <span className="loading-spinner" />
              분석 결과를 불러오는 중입니다.
            </div>
          ) : error ? (
            <div className="page-state page-state--error" role="alert">
              <strong>분석 결과를 불러오지 못했습니다.</strong>
              <p>{error}</p>
              <button className="button" onClick={retryLoad} type="button">
                다시 시도
              </button>
            </div>
          ) : activeCandidate ? (
            <div className="result-page__inner">
              <div className="page-heading result-heading">
                <span>RESULT</span>
                <h1>매물별 분석 결과를 확인하세요</h1>
                <p>
                  초기자금, 월 현금흐름과 1년 재무목표를 같은 기준으로
                  확인합니다.
                </p>
              </div>

              <div className="property-tabs result-tabs" role="tablist">
                {result?.candidates.map((candidate) => (
                  <button
                    aria-selected={candidate.property_id === activeId}
                    className={
                      candidate.property_id === activeId
                        ? 'is-active'
                        : undefined
                    }
                    key={candidate.property_id}
                    onClick={() => setActiveId(candidate.property_id)}
                    role="tab"
                    type="button"
                  >
                    {candidate.name}
                  </button>
                ))}
              </div>

              <section className="result-overview">
                <div>
                  <span>현재 조건에서 가장 먼저 확인할 항목</span>
                  <strong
                    className={`result-priority result-priority--${getPriority(activeCandidate).tone}`}
                  >
                    {getPriority(activeCandidate).label}
                  </strong>
                </div>
                <p>
                  아래 결과는 추천이나 순위가 아니라 입력한 재무 기준에 따른
                  계산 결과입니다.
                </p>
              </section>

              {activeCandidate.initial_funds.status ===
              'insufficient_initial_funds' ? (
                <div className="result-warning" role="alert">
                  <strong>초기자금이 부족합니다.</strong>
                  <p>
                    이후 월 현금흐름과 1년 재무목표는 계약이 체결된다는
                    가정으로 계산한 참고값입니다.
                  </p>
                </div>
              ) : null}

              <div className="result-card-grid">
                <ResultCard
                  icon={<WalletIcon />}
                  status={
                    initialFundsStatus[activeCandidate.initial_funds.status]
                  }
                  title="초기자금 및 유동성"
                >
                  <Metric
                    label="초기 필요자금"
                    value={formatWon(
                      activeCandidate.initial_funds.initial_cash_required,
                    )}
                  />
                  <Metric
                    label="입주 후 유동자산"
                    value={formatWon(
                      activeCandidate.initial_funds.post_move_liquid_assets,
                    )}
                  />
                  <Metric
                    label={
                      activeCandidate.initial_funds.emergency_fund_gap >= 0
                        ? '비상자금 대비 여유액'
                        : '비상자금 대비 부족액'
                    }
                    value={formatSignedWon(
                      activeCandidate.initial_funds.emergency_fund_gap,
                    )}
                  />
                </ResultCard>

                <ResultCard
                  icon={<HomeIcon />}
                  status={
                    monthlyCashFlowStatus[
                      activeCandidate.monthly_cash_flow.status
                    ]
                  }
                  title="월 현금흐름"
                >
                  <Metric
                    label="월 주거·교통비"
                    value={formatWon(
                      activeCandidate.monthly_cash_flow
                        .monthly_housing_and_transport_cost,
                    )}
                  />
                  <Metric
                    label="실제 월 잔여금"
                    value={formatSignedWon(
                      activeCandidate.monthly_cash_flow.actual_monthly_balance,
                    )}
                  />
                  <Metric
                    label="월 예산여유액"
                    value={formatSignedWon(
                      activeCandidate.monthly_cash_flow.monthly_budget_margin,
                    )}
                  />
                </ResultCard>

                <ResultCard
                  icon={<TargetIcon />}
                  status={
                    annualGoalStatus[activeCandidate.annual_goal.status]
                  }
                  title="1년 재무목표"
                >
                  <Metric
                    label="1년 재무목표액"
                    value={formatWon(
                      activeCandidate.annual_goal.annual_financial_target,
                    )}
                  />
                  <Metric
                    label="1년 후 예상 재무자원"
                    value={formatWon(
                      activeCandidate.annual_goal
                        .expected_resources_after_one_year,
                    )}
                  />
                  <Metric
                    label={
                      activeCandidate.annual_goal.annual_financial_surplus >= 0
                        ? '목표 대비 여유액'
                        : '목표 대비 부족액'
                    }
                    value={formatSignedWon(
                      activeCandidate.annual_goal.annual_financial_surplus,
                    )}
                  />
                  <Metric
                    label="재무목표 달성률"
                    value={`${activeCandidate.annual_goal.annual_goal_achievement_rate.toLocaleString('ko-KR')}%`}
                  />
                </ResultCard>
              </div>

              <section className="price-analysis">
                <div className="price-analysis__header">
                  <div>
                    <span>PRICE ANALYSIS</span>
                    <h2>가격 적정성 분석</h2>
                  </div>
                  <span
                    className={`result-status ${
                      activeCandidate.price_appropriateness.status ===
                      'available'
                        ? 'result-status--success'
                        : 'result-status--warning'
                    }`}
                  >
                    {activeCandidate.price_appropriateness.status ===
                    'available'
                      ? '비교 가능'
                      : '비교 불가'}
                  </span>
                </div>

                {activeCandidate.price_appropriateness.status ===
                  'available' &&
                activeCandidate.price_appropriateness.comparison_mode ===
                  'median' ? (
                  <>
                    <PriceComparisonChart
                      candidateCost={
                        (activeCandidate.price_appropriateness
                          .median_equivalent_monthly_cost ?? 0) +
                        (activeCandidate.price_appropriateness
                          .difference_from_median ?? 0)
                      }
                      medianCost={
                        activeCandidate.price_appropriateness
                          .median_equivalent_monthly_cost ?? 0
                      }
                    />
                    <dl className="price-analysis__metrics">
                      <Metric
                        label="중앙값 대비 차액"
                        value={formatSignedWon(
                          activeCandidate.price_appropriateness
                            .difference_from_median ?? 0,
                        )}
                      />
                      <Metric
                        label="중앙값 대비 차이율"
                        value={`${(
                          activeCandidate.price_appropriateness
                            .difference_rate_from_median ?? 0
                        ).toLocaleString('ko-KR')}%`}
                      />
                      <Metric
                        label="가격 백분위"
                        value={`${(
                          activeCandidate.price_appropriateness
                            .price_percentile ?? 0
                        ).toLocaleString('ko-KR')}%`}
                      />
                      <Metric
                        label="비교 표본 수"
                        value={`${activeCandidate.price_appropriateness.sample_count.toLocaleString('ko-KR')}개`}
                      />
                    </dl>
                  </>
                ) : activeCandidate.price_appropriateness.status ===
                    'available' &&
                  activeCandidate.price_appropriateness.comparison_mode ===
                    'individual_samples' ? (
                  <PriceSampleTable
                    samples={activeCandidate.price_appropriateness.samples}
                  />
                ) : (
                  <div className="price-analysis__unavailable">
                    <strong>가격 비교 결과를 제공할 수 없습니다.</strong>
                    <span>
                      비교 표본 수:{' '}
                      {activeCandidate.price_appropriateness.sample_count.toLocaleString(
                        'ko-KR',
                      )}
                      개
                    </span>
                  </div>
                )}
              </section>

              {activeCandidate.warnings.length > 0 ? (
                <div className="result-notes">
                  <h2>계산 유의사항</h2>
                  <ul>
                    {activeCandidate.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="page-state">
              <strong>표시할 매물 결과가 없습니다.</strong>
            </div>
          )}

          <footer className="form-navigation result-navigation">
            <button
              className="button button--secondary"
              onClick={onPrevious}
              type="button"
            >
              입력 수정
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
