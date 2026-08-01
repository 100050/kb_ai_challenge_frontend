import { useEffect, useMemo, useState } from 'react';

import { ApiError } from '../api/httpClient';
import { AnalysisHeader } from '../components/layout/AnalysisHeader';
import { HomeIcon, TargetIcon, WalletIcon } from '../components/ui/Icons';
import {
  getAnalysis,
  getAnalysisResult,
  getHousingPlan,
} from '../features/analysis/api/analysisApi';
import type {
  AnalysisResult,
  AnnualGoalStatus,
  InitialFundsStatus,
  MonthlyCashFlowStatus,
  PriceComparisonSample,
  HousingPlan,
} from '../features/analysis/model/analysisTypes';

interface ResultsPageProps {
  analysisId?: string;
  onChat?: () => void;
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
  above_target: { label: '목표 달성', tone: 'success' },
};

const propertyTypeLabels: Record<string, string> = {
  apartment: '아파트',
  row_house: '연립주택/다세대주택',
  multi_family: '연립주택/다세대주택',
  officetel: '오피스텔',
  detached_house: '단독주택/다가구주택',
  multi_household: '단독주택/다가구주택',
};

const previewResult: AnalysisResult = {
  analysis_id: 'preview',
  candidates: [
    {
      property_id: 'preview-property-1',
      name: '매물 1',
      memo: '역세권, 엘리베이터 있음',
      initial_funds: {
        available_cash: 95_000_000,
        available_own_funds: 95_000_000,
        initial_cash_required: 11_600_000,
        post_move_liquid_assets: 83_400_000,
        emergency_fund_gap: 73_400_000,
        status: 'sufficient',
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
        status: 'available',
        sample_count: 128,
        comparison_mode: 'median',
        median_equivalent_monthly_cost: 880_000,
        difference_from_median: 50_000,
        difference_rate_from_median: 5.68,
        price_percentile: 72.2,
        candidate_equivalent_monthly_cost: null,
        comparison_criteria: {
          lookback_months: 12,
          district_name: '강남구',
          property_type: 'officetel',
          area_tolerance_percent: 15,
        },
        samples: [],
        reason: null,
      },
      calculation_details: null,
      warnings: [],
    },
    {
      property_id: 'preview-property-2',
      name: '매물 2',
      memo: null,
      initial_funds: {
        available_cash: 95_000_000,
        available_own_funds: 95_000_000,
        initial_cash_required: 88_000_000,
        post_move_liquid_assets: 7_000_000,
        emergency_fund_gap: -3_000_000,
        status: 'emergency_fund_shortfall',
      },
      monthly_cash_flow: {
        monthly_housing_and_transport_cost: 1_150_000,
        essential_monthly_outflow: 2_650_000,
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
        candidate_equivalent_monthly_cost: null,
        samples: [],
        reason: '가격 비교에 필요한 매물 정보가 부족합니다.',
      },
      calculation_details: null,
      warnings: [],
    },
    {
      property_id: 'preview-property-3',
      name: '매물 3',
      memo: '채광 좋음',
      initial_funds: {
        available_cash: 95_000_000,
        available_own_funds: 95_000_000,
        initial_cash_required: 25_000_000,
        post_move_liquid_assets: 70_000_000,
        emergency_fund_gap: 60_000_000,
        status: 'sufficient',
      },
      monthly_cash_flow: {
        monthly_housing_and_transport_cost: 980_000,
        essential_monthly_outflow: 2_480_000,
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
        candidate_equivalent_monthly_cost: 845_000,
        samples: [
          {
            name: '수정 아파트 A',
            address: '부산시 동구 수정동 101-2',
            deposit: 10_000_000,
            monthly_rent: 700_000,
            exclusive_area_m2: 58,
            contract_date: '2026-07-01',
            equivalent_monthly_cost: 741_667,
          },
          {
            name: '수정 빌라 B',
            address: '부산시 동구 수정동 220-4',
            deposit: 20_000_000,
            monthly_rent: 800_000,
            exclusive_area_m2: 62,
            contract_date: '2026-07-02',
            equivalent_monthly_cost: 883_333,
          },
          {
            name: null,
            address: '부산시 동구 좌천동 88-1',
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

const previewHousingPlans: Record<string, HousingPlan> = {
  'preview-property-1': {
    property_id: 'preview-property-1',
    name: '매물 1',
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
    loan_plan: null,
    additional_costs: null,
    is_complete: true,
    updated_at: '2026-07-29T00:00:00Z',
  },
  'preview-property-2': {
    property_id: 'preview-property-2',
    name: '매물 2',
    memo: null,
    address: '서울특별시 관악구 신림동',
    property_type: 'officetel',
    legal_dong_code: null,
    exclusive_area_m2: 24,
    housing_type: 'jeonse',
    deposit: 80_000_000,
    monthly_rent: 0,
    maintenance_fee: 100_000,
    utilities: 50_000,
    transportation_cost: 80_000,
    loan_plan: null,
    additional_costs: null,
    is_complete: true,
    updated_at: '2026-07-29T00:00:00Z',
  },
  'preview-property-3': {
    property_id: 'preview-property-3',
    name: '매물 3',
    memo: '채광 좋음',
    address: '부산시 동구 수정동',
    property_type: 'multi_family',
    legal_dong_code: null,
    exclusive_area_m2: 60,
    housing_type: 'monthly_rent',
    deposit: 18_000_000,
    monthly_rent: 770_000,
    maintenance_fee: 80_000,
    utilities: 40_000,
    transportation_cost: 50_000,
    loan_plan: null,
    additional_costs: null,
    is_complete: true,
    updated_at: '2026-07-29T00:00:00Z',
  },
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

interface PriceComparisonChartProps {
  candidateCost: number;
  medianCost: number;
}

function PriceComparisonChart({
  candidateCost,
  medianCost,
}: PriceComparisonChartProps) {
  const maximum = Math.max(candidateCost, medianCost, 1);
  const minimum = Math.min(candidateCost, medianCost);
  const range = Math.max(maximum - minimum, maximum * 0.12, 1);
  const scaleMin = Math.max(0, minimum - range * 0.65);
  const scaleMax = maximum + range * 0.65;
  const position = (value: number) =>
    `${((value - scaleMin) / (scaleMax - scaleMin)) * 100}%`;
  const difference = candidateCost - medianCost;
  const differenceRate = medianCost === 0 ? 0 : (difference / medianCost) * 100;

  return (
    <figure
      aria-label={`비교군 중앙값 ${formatWon(medianCost)}, 현재 매물 ${formatWon(candidateCost)}`}
      className="price-chart"
    >
      <figcaption className="sr-only">환산 월 임대비용 비교</figcaption>
      <div className="price-chart__labels">
        <div
          className="price-chart__label price-chart__label--median"
          style={{ left: position(medianCost) }}
        >
          <span>비교군 중앙값</span>
          <strong>{formatWon(medianCost)}</strong>
        </div>
        <div
          className="price-chart__label price-chart__label--candidate"
          style={{ left: position(candidateCost) }}
        >
          <span>현재 매물</span>
          <strong>{formatWon(candidateCost)}</strong>
        </div>
      </div>
      <div className="price-chart__difference">
        {formatSignedWon(difference)} · {differenceRate > 0 ? '+' : ''}
        {differenceRate.toLocaleString('ko-KR', {
          maximumFractionDigits: 1,
        })}
        %
      </div>
      <div className="price-chart__track">
        <span className="price-chart__range" />
        <span
          className="price-chart__marker price-chart__marker--median"
          style={{ left: position(medianCost) }}
        />
        <span
          className="price-chart__marker price-chart__marker--candidate"
          style={{ left: position(candidateCost) }}
        />
      </div>
      <div className="price-chart__scale">
        <span>낮음</span>
        <span>높음</span>
      </div>
    </figure>
  );
}

type SampleSortKey = keyof PriceComparisonSample;
type SortDirection = 'ascending' | 'descending';
type ComparisonRow = PriceComparisonSample & {
  id: string;
  isCandidate: boolean;
};

const sampleColumns: {
  key: SampleSortKey;
  label: string;
}[] = [
  { key: 'name', label: '매물 이름' },
  { key: 'address', label: '주소' },
  { key: 'deposit', label: '보증금' },
  { key: 'monthly_rent', label: '월세' },
  { key: 'exclusive_area_m2', label: '전용면적' },
  { key: 'contract_date', label: '계약일' },
  { key: 'equivalent_monthly_cost', label: '환산 월 임대비용' },
];

interface PriceSampleTableProps {
  candidateEquivalentMonthlyCost: number | null;
  property: HousingPlan;
  samples: PriceComparisonSample[];
}

function PriceSampleTable({
  candidateEquivalentMonthlyCost,
  property,
  samples,
}: PriceSampleTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortKey, setSortKey] =
    useState<SampleSortKey>('equivalent_monthly_cost');
  const [direction, setDirection] = useState<SortDirection>('ascending');

  const sortedRows = useMemo(() => {
    const multiplier = direction === 'ascending' ? 1 : -1;
    const latestContractDate = samples.reduce(
      (latest, sample) =>
        sample.contract_date > latest ? sample.contract_date : latest,
      '',
    );
    const rows: ComparisonRow[] = [
      ...samples.map((sample, index) => ({
        ...sample,
        id: `sample-${index}-${sample.contract_date}-${sample.deposit}`,
        isCandidate: false,
      })),
      {
        id: `candidate-${property.property_id}`,
        isCandidate: true,
        name: property.name,
        address: property.address,
        deposit: property.deposit ?? 0,
        monthly_rent: property.monthly_rent ?? 0,
        exclusive_area_m2: property.exclusive_area_m2 ?? 0,
        contract_date: latestContractDate,
        equivalent_monthly_cost:
          candidateEquivalentMonthlyCost ?? 0,
      },
    ];

    return rows.sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (leftValue === null) {
        return rightValue === null ? 0 : 1;
      }
      if (rightValue === null) {
        return -1;
      }

      if (typeof leftValue === 'string' && typeof rightValue === 'string') {
        return leftValue.localeCompare(rightValue) * multiplier;
      }

      return (Number(leftValue) - Number(rightValue)) * multiplier;
    });
  }, [
    candidateEquivalentMonthlyCost,
    direction,
    property,
    samples,
    sortKey,
  ]);

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
      <div className="sample-table__property">
        <span>내 매물</span>
        <strong>{property.name ?? '이름 없는 매물'}</strong>
        <p>{property.address ?? '주소 미입력'}</p>
      </div>
      <button
        aria-expanded={isExpanded}
        className="sample-table__toggle"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        type="button"
      >
        {isExpanded
          ? '표본 접기'
          : `비교 표본 ${samples.length.toLocaleString('ko-KR')}건 펼쳐보기`}
        <span aria-hidden="true">{isExpanded ? '⌃' : '⌄'}</span>
      </button>
      {isExpanded ? <table className="sample-table">
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
          {sortedRows.map((sample) => (
            <tr
              className={
                sample.isCandidate
                  ? 'sample-table__my-property'
                  : undefined
              }
              key={sample.id}
            >
              <td>
                {sample.name ??
                  (sample.isCandidate
                    ? '이름 없는 매물'
                    : '이름 정보 없음')}
                {sample.isCandidate ? <small>내 매물</small> : null}
              </td>
              <td>
                {sample.address ??
                  (sample.isCandidate ? '주소 미입력' : '주소 정보 없음')}
              </td>
              <td>{formatWon(sample.deposit)}</td>
              <td>{formatWon(sample.monthly_rent)}</td>
              <td>
                {sample.isCandidate && property.exclusive_area_m2 === null
                  ? '—'
                  : `${sample.exclusive_area_m2.toLocaleString('ko-KR')}㎡`}
              </td>
              <td>
                {sample.isCandidate ? '—' : sample.contract_date || '—'}
              </td>
              <td>
                {sample.isCandidate &&
                candidateEquivalentMonthlyCost === null
                  ? '—'
                  : formatWon(sample.equivalent_monthly_cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table> : null}
    </div>
  );
}

interface MetricProps {
  isNegative?: boolean;
  label: React.ReactNode;
  tone?: ResultTone;
  value: string;
}

function Metric({ isNegative = false, label, tone, value }: MetricProps) {
  const valueTone = tone ?? (isNegative ? 'danger' : undefined);

  return (
    <div className="result-metric">
      <dt>{label}</dt>
      <dd
        className={
          [
            valueTone ? `result-metric__value--${valueTone}` : '',
            isNegative ? 'result-metric__value--negative' : '',
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
      >
        {value}
      </dd>
    </div>
  );
}

interface ResultCardProps {
  className?: string;
  children: React.ReactNode;
  featuredLabel: string;
  featuredValue: string;
  featuredValueIsNegative?: boolean;
  footer?: React.ReactNode;
  icon: React.ReactNode;
  status: StatusPresentation;
  title: string;
}

function ResultCard({
  className,
  children,
  featuredLabel,
  featuredValue,
  featuredValueIsNegative = false,
  footer,
  icon,
  status,
  title,
}: ResultCardProps) {
  return (
    <article
      className={`result-card result-card--${status.tone}${className ? ` ${className}` : ''}`}
    >
      <div className="result-card__header">
        <div>
          {icon}
          <h2>{title}</h2>
        </div>
        <span className={`result-status result-status--${status.tone}`}>
          {status.label}
        </span>
      </div>
      <div className="result-card__featured">
        <strong
          className={
            featuredValueIsNegative
              ? 'result-metric__value--negative'
              : undefined
          }
        >
          {featuredValue}
        </strong>
        <span>{featuredLabel}</span>
      </div>
      <dl>{children}</dl>
      {footer ? <div className="result-card__footer">{footer}</div> : null}
    </article>
  );
}

function ResultSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="result-section-heading">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function ResultsPage({
  analysisId,
  onChat,
  onExit,
  onPrevious,
}: ResultsPageProps) {
  const [result, setResult] = useState<AnalysisResult | null>(
    analysisId ? null : previewResult,
  );
  const [housingPlans, setHousingPlans] = useState<
    Record<string, HousingPlan>
  >(analysisId ? {} : previewHousingPlans);
  const [activeId, setActiveId] = useState(
    analysisId ? '' : previewResult.candidates[0].property_id,
  );
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(
    analysisId ? null : 3_500_000,
  );
  const [isLoading, setIsLoading] = useState(Boolean(analysisId));
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [showComparisonCriteria, setShowComparisonCriteria] = useState(false);

  useEffect(() => {
    if (!analysisId) {
      return;
    }

    const controller = new AbortController();
    Promise.all([
      getAnalysisResult(analysisId, controller.signal),
      getAnalysis(analysisId, controller.signal),
    ])
      .then(([response, analysis]) => {
        setResult(response);
        setMonthlyIncome(
          analysis.cash_flow?.after_tax_monthly_income ?? null,
        );
        setActiveId(response.candidates[0]?.property_id ?? '');
        return Promise.allSettled(
          response.candidates.map((candidate) =>
            getHousingPlan(
              analysisId,
              candidate.property_id,
              controller.signal,
            ),
          ),
        );
      })
      .then((settledPlans) => {
        setHousingPlans(
          settledPlans.reduce<Record<string, HousingPlan>>(
            (plans, settledPlan) => {
              if (settledPlan.status === 'fulfilled') {
                plans[settledPlan.value.property_id] = settledPlan.value;
              }
              return plans;
            },
            {},
          ),
        );
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

  const priceComparisonMode = useMemo(() => {
    const priceResult = activeCandidate?.price_appropriateness;
    if (!priceResult || priceResult.status !== 'available') {
      return null;
    }
    if (priceResult.sample_count >= 30) {
      return 'median';
    }
    if (priceResult.sample_count > 0) {
      return 'individual_samples';
    }
    return priceResult.comparison_mode;
  }, [activeCandidate]);

  const activeMonthlyIncome = activeCandidate
    ? (activeCandidate.monthly_cash_flow.monthly_income ?? monthlyIncome)
    : null;
  const activeAvailableOwnFunds = activeCandidate
    ? (activeCandidate.initial_funds.available_own_funds ??
      activeCandidate.initial_funds.available_cash)
    : 0;
  const activeBaseMonthlyBalance = activeCandidate
    ? (activeCandidate.monthly_cash_flow.base_monthly_balance ??
      (activeMonthlyIncome ?? 0) -
        activeCandidate.monthly_cash_flow.essential_monthly_outflow)
    : 0;
  const activeTargetMonthlySavings = activeCandidate
    ? (activeCandidate.monthly_cash_flow.target_monthly_savings ??
      activeBaseMonthlyBalance -
        activeCandidate.monthly_cash_flow.actual_monthly_balance)
    : 0;
  const activeMonthlySafetyMargin = activeCandidate
    ? activeCandidate.monthly_cash_flow.actual_monthly_balance -
      activeCandidate.monthly_cash_flow.monthly_budget_margin
    : 0;
  const activeComparisonAreaRange = (() => {
    if (!activeCandidate) {
      return null;
    }
    const area = housingPlans[activeCandidate.property_id]?.exclusive_area_m2;
    const tolerance =
      activeCandidate.price_appropriateness.comparison_criteria
        ?.area_tolerance_percent;
    if (area === null || area === undefined || tolerance === undefined) {
      return null;
    }
    const ratio = tolerance / 100;
    const formatArea = (value: number) =>
      value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
    return `${formatArea(area * (1 - ratio))}㎡ ~ ${formatArea(area * (1 + ratio))}㎡ (±${tolerance}%)`;
  })();

  const retryLoad = () => {
    setIsLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="analysis-page">
      <AnalysisHeader onExit={onExit} />
      <div className="analysis-shell analysis-shell--full">
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
              <div
                aria-label="가격 분석 매물 선택"
                className="property-tabs result-tabs"
                role="tablist"
              >
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

              <ResultSectionHeading
                description="주변 유사 거래와 환산 월 임대비용을 같은 기준으로 비교합니다."
                eyebrow="01 PRICE ANALYSIS"
                title="가격 적정성 분석"
              />

              <div className="financial-analysis-heading">
                <ResultSectionHeading
                  description="입주 시점의 자금 상태부터 월 현금흐름과 1년 재무목표까지 확인합니다."
                  eyebrow="02 FINANCIAL ANALYSIS"
                  title="재무 적정성 분석"
                />
              </div>

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
                  featuredLabel="입주 후 유동자산"
                  featuredValue={formatWon(
                    activeCandidate.initial_funds.post_move_liquid_assets,
                  )}
                  featuredValueIsNegative={
                    activeCandidate.initial_funds.post_move_liquid_assets < 0
                  }
                  footer={
                    <p
                      className={`result-card-summary result-card-summary--${initialFundsStatus[activeCandidate.initial_funds.status].tone}`}
                    >
                      {activeCandidate.initial_funds.status === 'sufficient'
                        ? '초기자금과 최소 비상자금을 모두 충족합니다.'
                        : activeCandidate.initial_funds.status ===
                            'insufficient_initial_funds'
                          ? '계약에 필요한 초기자금이 부족합니다.'
                          : '최소 비상자금 기준을 충족하지 못합니다.'}
                    </p>
                  }
                  icon={<WalletIcon />}
                  status={
                    initialFundsStatus[activeCandidate.initial_funds.status]
                  }
                  title="초기자금 및 유동성"
                >
                  <Metric
                    isNegative={activeAvailableOwnFunds < 0}
                    label="활용 가능 총자금"
                    value={formatWon(activeAvailableOwnFunds)}
                  />
                  <Metric
                    label="초기 필요자금"
                    value={formatWon(
                      activeCandidate.initial_funds.initial_cash_required,
                    )}
                  />
                  <Metric
                    isNegative={
                      activeCandidate.initial_funds.post_move_liquid_assets < 0
                    }
                    label="입주 후 유동자산"
                    value={formatWon(
                      activeCandidate.initial_funds.post_move_liquid_assets,
                    )}
                  />
                  <Metric
                    isNegative={
                      activeCandidate.initial_funds.emergency_fund_gap < 0
                    }
                    label={
                      activeCandidate.initial_funds.emergency_fund_gap >= 0
                        ? '비상자금 대비 여유액'
                        : '비상자금 대비 부족액'
                    }
                    tone={
                      activeCandidate.initial_funds.emergency_fund_gap >= 0
                        ? 'success'
                        : 'danger'
                    }
                    value={formatSignedWon(
                      activeCandidate.initial_funds.emergency_fund_gap,
                    )}
                  />
                </ResultCard>

                <ResultCard
                  className="result-card--cash-flow"
                  featuredLabel="실제 월 잔여금"
                  featuredValue={formatSignedWon(
                    activeCandidate.monthly_cash_flow.actual_monthly_balance,
                  )}
                  featuredValueIsNegative={
                    activeCandidate.monthly_cash_flow.actual_monthly_balance < 0
                  }
                  icon={<HomeIcon />}
                  footer={
                    <div
                      className={`cash-flow-summary cash-flow-summary--${monthlyCashFlowStatus[activeCandidate.monthly_cash_flow.status].tone}`}
                    >
                      <span>
                        안전여유 {formatWon(activeMonthlySafetyMargin)} 확보 후
                      </span>
                      <strong
                        className={
                          activeCandidate.monthly_cash_flow
                            .monthly_budget_margin >= 0
                            ? 'semantic-value--success'
                            : 'semantic-value--danger'
                        }
                      >
                        월 예산여유{' '}
                        {formatSignedWon(
                          activeCandidate.monthly_cash_flow
                            .monthly_budget_margin,
                        )}
                      </strong>
                    </div>
                  }
                  status={
                    monthlyCashFlowStatus[
                      activeCandidate.monthly_cash_flow.status
                    ]
                  }
                  title="월 현금흐름"
                >
                  <Metric
                    label="월 현금유입"
                    value={
                      activeMonthlyIncome === null
                        ? '—'
                        : formatWon(activeMonthlyIncome)
                    }
                  />
                  <Metric
                    label="－ 필수 월 현금유출"
                    value={formatWon(
                      -activeCandidate.monthly_cash_flow
                        .essential_monthly_outflow,
                    )}
                  />
                  <Metric
                    label="기본 월 잔여금"
                    value={formatWon(activeBaseMonthlyBalance)}
                  />
                  <Metric
                    label="－ 목표저축액"
                    value={formatWon(-activeTargetMonthlySavings)}
                  />
                  <Metric
                    isNegative={
                      activeCandidate.monthly_cash_flow.actual_monthly_balance <
                      0
                    }
                    label="실제 월 잔여금"
                    tone={
                      activeCandidate.monthly_cash_flow
                        .actual_monthly_balance >= 0
                        ? 'success'
                        : 'danger'
                    }
                    value={formatSignedWon(
                      activeCandidate.monthly_cash_flow.actual_monthly_balance,
                    )}
                  />
                </ResultCard>

                <ResultCard
                  featuredLabel="목표 달성률"
                  featuredValue={
                    activeCandidate.annual_goal.annual_goal_achievement_rate ===
                    null
                      ? '—'
                      : `${activeCandidate.annual_goal.annual_goal_achievement_rate.toLocaleString('ko-KR')}%`
                  }
                  featuredValueIsNegative={
                    activeCandidate.annual_goal.annual_goal_achievement_rate !==
                      null &&
                    activeCandidate.annual_goal.annual_goal_achievement_rate < 100
                  }
                  footer={
                    <p
                      className={`result-card-summary result-card-summary--${activeCandidate.annual_goal.annual_goal_achievement_rate === null ? 'warning' : annualGoalStatus[activeCandidate.annual_goal.status].tone}`}
                    >
                      {activeCandidate.annual_goal
                        .annual_goal_achievement_rate === null
                        ? '설정한 1년 재무목표가 없습니다.'
                        : activeCandidate.annual_goal.status === 'below_target'
                          ? '현재 조건에서는 1년 재무목표 달성이 어렵습니다.'
                          : '1년 재무목표를 달성하고도 여유가 예상됩니다.'}
                    </p>
                  }
                  icon={<TargetIcon />}
                  status={
                    activeCandidate.annual_goal
                      .annual_goal_achievement_rate === null
                      ? { label: '목표 없음', tone: 'warning' }
                      : annualGoalStatus[activeCandidate.annual_goal.status]
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
                    isNegative={
                      activeCandidate.annual_goal
                        .expected_resources_after_one_year < 0
                    }
                    label="1년 후 예상 유동재원"
                    value={formatWon(
                      activeCandidate.annual_goal
                        .expected_resources_after_one_year,
                    )}
                  />
                  <Metric
                    isNegative={
                      activeCandidate.annual_goal.annual_financial_surplus < 0
                    }
                    label={
                      activeCandidate.annual_goal.annual_financial_surplus >= 0
                        ? '목표 대비 여유액'
                        : '목표 대비 부족액'
                    }
                    tone={
                      activeCandidate.annual_goal.annual_financial_surplus >= 0
                        ? 'success'
                        : 'danger'
                    }
                    value={formatSignedWon(
                      activeCandidate.annual_goal.annual_financial_surplus,
                    )}
                  />
                  <Metric
                    isNegative={
                      activeCandidate.annual_goal
                        .annual_goal_achievement_rate !== null &&
                      activeCandidate.annual_goal
                        .annual_goal_achievement_rate < 0
                    }
                    label="재무목표 달성률"
                    tone={
                      activeCandidate.annual_goal
                        .annual_goal_achievement_rate === null
                        ? undefined
                        : activeCandidate.annual_goal
                              .annual_goal_achievement_rate >= 100
                          ? 'success'
                          : 'warning'
                    }
                    value={
                      activeCandidate.annual_goal
                        .annual_goal_achievement_rate === null
                        ? '—'
                        : `${activeCandidate.annual_goal.annual_goal_achievement_rate.toLocaleString('ko-KR')}%`
                    }
                  />
                </ResultCard>
              </div>

              <p className="financial-analysis-disclaimer">
                <span aria-hidden="true">ⓘ</span>
                분석 결과는 입력한 금액과 현재 조건이 유지된다는 가정에 따른
                예상치이며, 소득 변화·예상치 못한 지출·투자손익은 반영하지
                않습니다.
              </p>

              <section className="price-analysis">
                <div className="price-analysis__header">
                  <div>
                    <span>PRICE ANALYSIS</span>
                    <h2>환산 월 임대비용 비교</h2>
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
                priceComparisonMode === 'median' ? (
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
                        isNegative={
                          (activeCandidate.price_appropriateness
                            .difference_from_median ?? 0) < 0
                        }
                        label="중앙값 대비 차액"
                        tone={
                          (activeCandidate.price_appropriateness
                            .difference_from_median ?? 0) > 0
                            ? 'danger'
                            : (activeCandidate.price_appropriateness
                                  .difference_from_median ?? 0) < 0
                              ? 'success'
                              : undefined
                        }
                        value={formatSignedWon(
                          activeCandidate.price_appropriateness
                            .difference_from_median ?? 0,
                        )}
                      />
                      <Metric
                        isNegative={
                          (activeCandidate.price_appropriateness
                            .difference_rate_from_median ?? 0) < 0
                        }
                        label="중앙값 대비 차이율"
                        tone={
                          (activeCandidate.price_appropriateness
                            .difference_rate_from_median ?? 0) > 0
                            ? 'danger'
                            : (activeCandidate.price_appropriateness
                                  .difference_rate_from_median ?? 0) < 0
                              ? 'success'
                              : undefined
                        }
                        value={`${(
                          activeCandidate.price_appropriateness
                            .difference_rate_from_median ?? 0
                        ) > 0 ? '+' : ''}${(
                          activeCandidate.price_appropriateness
                            .difference_rate_from_median ?? 0
                        ).toLocaleString('ko-KR')}%`}
                      />
                      <Metric
                        label={
                          <span className="metric-label-with-help">
                            가격 백분위
                            <span className="help-tooltip">
                              <button
                                aria-label="가격 백분위 설명"
                                className="help-tooltip__trigger"
                                type="button"
                              >
                                ?
                              </button>
                              <span
                                className="help-tooltip__content"
                                role="tooltip"
                              >
                                해당 거래보다 가격이 저렴한 비교 거래의 비율
                              </span>
                            </span>
                          </span>
                        }
                        value={`${(
                          activeCandidate.price_appropriateness
                            .price_percentile ?? 0
                        ).toLocaleString('ko-KR')}%`}
                      />
                    </dl>
                    <div className="price-analysis__sample-summary">
                      <div>
                        <span aria-hidden="true">◉</span>
                        <strong>
                          비교 표본{' '}
                          {activeCandidate.price_appropriateness.sample_count.toLocaleString(
                            'ko-KR',
                          )}
                          건
                        </strong>
                        {activeCandidate.price_appropriateness
                          .comparison_criteria ? (
                          <small>
                            최근{' '}
                            {
                              activeCandidate.price_appropriateness
                                .comparison_criteria.lookback_months
                            }
                            개월 ·{' '}
                            {
                              activeCandidate.price_appropriateness
                                .comparison_criteria.district_name
                            }{' '}
                            · 동일 주택유형 · 유사 면적
                          </small>
                        ) : null}
                      </div>
                      <button
                        aria-expanded={showComparisonCriteria}
                        className="button button--secondary price-analysis__criteria-button"
                        onClick={() =>
                          setShowComparisonCriteria((isVisible) => !isVisible)
                        }
                        type="button"
                      >
                        비교 기준 보기
                      </button>
                    </div>
                    {showComparisonCriteria ? (
                      <div className="price-analysis__criteria">
                        {activeCandidate.price_appropriateness
                          .comparison_criteria ? (
                          <dl>
                            <Metric
                              label="거래 기간"
                              value={`최근 ${activeCandidate.price_appropriateness.comparison_criteria.lookback_months}개월`}
                            />
                            <Metric
                              label="지역"
                              value={
                                activeCandidate.price_appropriateness
                                  .comparison_criteria.district_name
                              }
                            />
                            <Metric
                              label="주택유형"
                              value={
                                propertyTypeLabels[
                                  activeCandidate.price_appropriateness
                                    .comparison_criteria.property_type
                                ] ?? '기타 주택'
                              }
                            />
                            <Metric
                              label="면적 허용범위"
                              value={
                                activeComparisonAreaRange ??
                                `±${activeCandidate.price_appropriateness.comparison_criteria.area_tolerance_percent}%`
                              }
                            />
                          </dl>
                        ) : (
                          <p>현재 결과에는 세부 비교 기준이 없습니다.</p>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : activeCandidate.price_appropriateness.status ===
                    'available' &&
                  priceComparisonMode === 'individual_samples' &&
                  housingPlans[activeCandidate.property_id] ? (
                  <PriceSampleTable
                    candidateEquivalentMonthlyCost={
                      activeCandidate.price_appropriateness
                        .candidate_equivalent_monthly_cost
                    }
                    property={housingPlans[activeCandidate.property_id]}
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
                      <li key={warning.code}>{warning.message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <section className="result-ai-analysis">
                <ResultSectionHeading
                  description="가격과 재무 분석 결과를 함께 살펴보고, 선택 전 확인할 점을 정리합니다."
                  eyebrow="03 AI ANALYSIS"
                  title="AI 종합 해설"
                />
                <div className="ai-analysis-card">
                  <div className="ai-analysis-card__heading">
                    <span aria-hidden="true">✦</span>
                    <h2>이 매물은 이렇게 볼 수 있어요</h2>
                  </div>
                  <p>
                    {activeCandidate.price_appropriateness.status ===
                      'available' &&
                    (activeCandidate.price_appropriateness
                      .difference_rate_from_median ?? 0) !== 0
                      ? `환산 월 임대비용이 비교군 중앙값보다 ${Math.abs(activeCandidate.price_appropriateness.difference_rate_from_median ?? 0).toLocaleString('ko-KR')}% ${(activeCandidate.price_appropriateness.difference_rate_from_median ?? 0) > 0 ? '높습니다' : '낮습니다'}.`
                      : '환산 월 임대비용이 비교군 중앙값과 비슷한 수준입니다.'}
                    {' '}월 지출 후 실제 잔여금은{' '}
                    {formatSignedWon(
                      activeCandidate.monthly_cash_flow.actual_monthly_balance,
                    )}
                    이며,{' '}
                    {activeCandidate.annual_goal
                      .annual_goal_achievement_rate === null
                      ? '설정한 1년 재무목표는 없습니다.'
                      : `1년 재무목표 달성률은 ${activeCandidate.annual_goal.annual_goal_achievement_rate.toLocaleString('ko-KR')}%입니다.`}
                  </p>
                  <div className="ai-analysis-points">
                    <article className="ai-analysis-point ai-analysis-point--success">
                      <h3>장점</h3>
                      <strong>
                        {activeCandidate.annual_goal
                          .annual_goal_achievement_rate === null
                          ? '월 현금흐름 확인 가능'
                          : activeCandidate.annual_goal.status !== 'below_target'
                          ? '1년 재무목표 달성 가능'
                          : activeCandidate.monthly_cash_flow
                                .actual_monthly_balance >= 0
                            ? '월 현금흐름 여유'
                            : '확인된 재무 장점 없음'}
                      </strong>
                      <p>
                        입주 후 유동자산{' '}
                        {formatWon(
                          activeCandidate.initial_funds
                            .post_move_liquid_assets,
                        )}
                        을 확인하세요.
                      </p>
                    </article>
                    <article className="ai-analysis-point ai-analysis-point--danger">
                      <h3>부담</h3>
                      <strong>
                        {activeCandidate.monthly_cash_flow
                          .actual_monthly_balance < 0
                          ? '월 현금흐름 적자'
                          : '가격 부담 확인'}
                      </strong>
                      <p>
                        중앙값 대비 차이율{' '}
                        {(
                          activeCandidate.price_appropriateness
                            .difference_rate_from_median ?? 0
                        ).toLocaleString('ko-KR')}
                        %입니다.
                      </p>
                    </article>
                    <article className="ai-analysis-point ai-analysis-point--warning">
                      <h3>확인할 점</h3>
                      <strong>입지·시설 조건</strong>
                      <p>
                        {activeCandidate.memo
                          ? `매물 메모: ${activeCandidate.memo}`
                          : '가격 지표에 반영되지 않는 실제 주거 조건을 함께 확인하세요.'}
                      </p>
                    </article>
                  </div>
                  <p className="ai-analysis-disclaimer">
                    AI는 계산 결과를 변경하거나 계약 여부를 확정하지 않으며,
                    입력된 수치와 매물 메모를 바탕으로 비교 관점을
                    제공합니다.
                  </p>
                </div>
              </section>
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
            {onChat ? (
              <button
                className="button button--primary"
                onClick={onChat}
                type="button"
              >
                AI에게 물어보기
              </button>
            ) : null}
          </footer>
        </main>
      </div>
    </div>
  );
}
