import { FormEvent, useEffect, useMemo, useState } from 'react';

import { ApiError } from '../api/httpClient';
import { AnalysisHeader } from '../components/layout/AnalysisHeader';
import { StepSidebar } from '../components/layout/StepSidebar';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ArrowRightIcon, HomeIcon } from '../components/ui/Icons';
import {
  createHousingPlan,
  deleteHousingPlan,
  getHousingPlan,
  getHousingPlans,
  startEvaluation,
  updateHousingPlan,
} from '../features/analysis/api/analysisApi';
import type {
  HousingPlan,
  HousingType,
} from '../features/analysis/model/analysisTypes';

interface HousingPlansPageProps {
  analysisId?: string;
  onExit: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface HousingFormValues {
  propertyId: string;
  name: string;
  memo: string;
  city: string;
  district: string;
  neighborhood: string;
  propertyType: string;
  exclusiveArea: string;
  housingType: HousingType | '';
  deposit: string;
  monthlyRent: string;
  maintenanceFee: string;
  utilities: string;
  transportationCost: string;
  hasDepositLoan: boolean;
  depositLoanAmount: string;
  annualInterestRate: string;
  brokerageFee: string;
  movingCost: string;
  otherMoveInCost: string;
  isComplete: boolean;
}

function createEmptyPlan(index: number): HousingFormValues {
  return {
    propertyId: `local-${Date.now()}-${index}`,
    name: '',
    memo: '',
    city: '',
    district: '',
    neighborhood: '',
    propertyType: '',
    exclusiveArea: '',
    housingType: '',
    deposit: '',
    monthlyRent: '',
    maintenanceFee: '',
    utilities: '',
    transportationCost: '',
    hasDepositLoan: false,
    depositLoanAmount: '',
    annualInterestRate: '',
    brokerageFee: '',
    movingCost: '',
    otherMoveInCost: '',
    isComplete: false,
  };
}

function wonToManwon(value: number | null) {
  return value === null ? '' : String(value / 10_000);
}

function planToValues(plan: HousingPlan): HousingFormValues {
  const [city = '', district = '', neighborhood = ''] = (
    plan.address ?? ''
  ).trim().split(/\s+/);

  return {
    propertyId: plan.property_id,
    name: plan.name ?? '',
    memo: plan.memo ?? '',
    city,
    district,
    neighborhood,
    propertyType:
      plan.property_type === 'multi_family'
        ? 'row_house'
        : plan.property_type === 'multi_household'
          ? 'detached_house'
          : (plan.property_type ?? ''),
    exclusiveArea:
      plan.exclusive_area_m2 === null ? '' : String(plan.exclusive_area_m2),
    housingType: plan.housing_type ?? '',
    deposit: wonToManwon(plan.deposit),
    monthlyRent: wonToManwon(plan.monthly_rent),
    maintenanceFee: wonToManwon(plan.maintenance_fee),
    utilities: wonToManwon(plan.utilities),
    transportationCost: wonToManwon(plan.transportation_cost),
    hasDepositLoan:
      plan.loan_plan !== null &&
      (plan.loan_plan.deposit_loan_amount > 0 ||
        plan.loan_plan.annual_interest_rate > 0),
    depositLoanAmount: wonToManwon(plan.loan_plan?.deposit_loan_amount ?? null),
    annualInterestRate:
      plan.loan_plan === null ? '' : String(plan.loan_plan.annual_interest_rate),
    brokerageFee: wonToManwon(plan.additional_costs?.brokerage_fee ?? null),
    movingCost: wonToManwon(plan.additional_costs?.moving_cost ?? null),
    otherMoveInCost: wonToManwon(
      plan.additional_costs?.other_move_in_cost ?? null,
    ),
    isComplete: plan.is_complete,
  };
}

function optionalNumber(value: string) {
  return value === '' ? null : Number(value);
}

function manwon(value: string) {
  return Number(value || 0) * 10_000;
}

function valuesToRequest(values: HousingFormValues) {
  return {
    name: values.name,
    memo: values.memo || null,
    address: [values.city, values.district, values.neighborhood].join(' '),
    property_type: values.propertyType || null,
    exclusive_area_m2: optionalNumber(values.exclusiveArea),
    housing_type: values.housingType || null,
    deposit: manwon(values.deposit),
    monthly_rent:
      values.housingType === 'jeonse' ? 0 : manwon(values.monthlyRent),
    maintenance_fee: manwon(values.maintenanceFee),
    utilities: manwon(values.utilities),
    transportation_cost: manwon(values.transportationCost),
    loan_plan: {
      deposit_loan_amount: values.hasDepositLoan
        ? manwon(values.depositLoanAmount)
        : 0,
      annual_interest_rate: values.hasDepositLoan
        ? Number(values.annualInterestRate || 0)
        : 0,
    },
    additional_costs: {
      brokerage_fee: manwon(values.brokerageFee),
      moving_cost: manwon(values.movingCost),
      other_move_in_cost: manwon(values.otherMoveInCost),
    },
  };
}

function valuesToPartialRequest(values: HousingFormValues) {
  const request: ReturnType<typeof valuesToRequest> = valuesToRequest(values);

  return {
    ...(values.name ? { name: request.name } : {}),
    memo: request.memo,
    ...(values.city && values.district && values.neighborhood
      ? { address: request.address }
      : {}),
    ...(values.propertyType ? { property_type: request.property_type } : {}),
    ...(values.exclusiveArea
      ? { exclusive_area_m2: request.exclusive_area_m2 }
      : {}),
    ...(values.housingType ? { housing_type: request.housing_type } : {}),
    ...(values.deposit ? { deposit: request.deposit } : {}),
    ...(values.monthlyRent || values.housingType === 'jeonse'
      ? { monthly_rent: request.monthly_rent }
      : {}),
    ...(values.maintenanceFee
      ? { maintenance_fee: request.maintenance_fee }
      : {}),
    ...(values.utilities ? { utilities: request.utilities } : {}),
    ...(values.transportationCost
      ? { transportation_cost: request.transportation_cost }
      : {}),
    loan_plan: request.loan_plan,
    ...(values.brokerageFee || values.movingCost || values.otherMoveInCost
      ? { additional_costs: request.additional_costs }
      : {}),
  };
}

interface TextFieldProps {
  disabled?: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

function TextField({
  disabled,
  id,
  label,
  onChange,
  placeholder,
  value,
}: TextFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        className="text-input"
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

export function HousingPlansPage({
  analysisId,
  onExit,
  onNext,
  onPrevious,
}: HousingPlansPageProps) {
  const [plans, setPlans] = useState<HousingFormValues[]>(() => [
    createEmptyPlan(1),
  ]);
  const [activeId, setActiveId] = useState(plans[0].propertyId);
  const [isLoading, setIsLoading] = useState(Boolean(analysisId));
  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!analysisId) {
      return;
    }

    const controller = new AbortController();

    getHousingPlans(analysisId, controller.signal)
      .then(async ({ housing_plans: summaries }) => {
        if (summaries.length === 0) {
          const createdPlan = planToValues(
            await createHousingPlan(analysisId),
          );
          setPlans([createdPlan]);
          setActiveId(createdPlan.propertyId);
          return;
        }

        const details = await Promise.all(
          summaries.map((summary) =>
            getHousingPlan(
              analysisId,
              summary.property_id,
              controller.signal,
            ),
          ),
        );
        const loadedPlans = details.map(planToValues);
        setPlans(loadedPlans);
        setActiveId(loadedPlans[0].propertyId);
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
            : '후보 매물을 불러오지 못했습니다.',
        );
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [analysisId]);

  const activePlan = plans.find((plan) => plan.propertyId === activeId);

  const updateActive = (
    key: keyof HousingFormValues,
    value: string | boolean,
  ) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.propertyId === activeId ? { ...plan, [key]: value } : plan,
      ),
    );
    setError('');
    setSaveMessage('');
  };

  const addPlan = async () => {
    if (plans.length >= 10) {
      setError('후보 매물은 최대 10개까지 입력할 수 있습니다.');
      return;
    }

    try {
      const nextPlan = analysisId
        ? planToValues(await createHousingPlan(analysisId))
        : createEmptyPlan(plans.length + 1);
      setPlans((current) => [...current, nextPlan]);
      setActiveId(nextPlan.propertyId);
    } catch (addError) {
      setError(
        addError instanceof ApiError
          ? addError.message
          : '후보 매물을 추가하지 못했습니다.',
      );
    }
  };

  const removePlan = async (targetPlan: HousingFormValues) => {
    if (plans.length === 1) {
      setError('최소 한 개의 후보 매물이 필요합니다.');
      return;
    }

    try {
      if (analysisId) {
        await deleteHousingPlan(analysisId, targetPlan.propertyId);
      }
      const remaining = plans.filter(
        (plan) => plan.propertyId !== targetPlan.propertyId,
      );
      setPlans(remaining);
      if (targetPlan.propertyId === activeId) {
        setActiveId(remaining[0]?.propertyId ?? '');
      }
    } catch {
      setError('후보 매물을 삭제하지 못했습니다.');
    }
  };

  const initialRequiredFunds = useMemo(() => {
    if (!activePlan) {
      return 0;
    }
    return (
      Number(activePlan.deposit || 0) -
      Number(activePlan.depositLoanAmount || 0) +
      Number(activePlan.brokerageFee || 0) +
      Number(activePlan.movingCost || 0) +
      Number(activePlan.otherMoveInCost || 0)
    );
  }, [activePlan]);

  const monthlyHousingCost = useMemo(() => {
    if (!activePlan) {
      return 0;
    }
    const monthlyInterest =
      (Number(activePlan.depositLoanAmount || 0) *
        Number(activePlan.annualInterestRate || 0)) /
      100 /
      12;
    return (
      Number(activePlan.monthlyRent || 0) +
      Number(activePlan.maintenanceFee || 0) +
      Number(activePlan.utilities || 0) +
      Number(activePlan.transportationCost || 0) +
      monthlyInterest
    );
  }, [activePlan]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activePlan) {
      setError('후보 매물을 추가해 주세요.');
      return;
    }
    if (
      !activePlan.name ||
      !activePlan.city ||
      !activePlan.district ||
      !activePlan.neighborhood ||
      !activePlan.housingType
    ) {
      setError('매물 이름, 시·구·동과 계약 유형을 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setIsEvaluating(Boolean(analysisId));
    setError('');
    try {
      if (analysisId) {
        const saved = await updateHousingPlan(
          analysisId,
          activePlan.propertyId,
          valuesToRequest(activePlan),
        );
        const savedValues = planToValues(saved);
        setPlans((current) =>
          current.map((plan) =>
            plan.propertyId === savedValues.propertyId ? savedValues : plan,
          ),
        );
        await startEvaluation(analysisId);
      }
      onNext();
    } catch (saveError) {
      setIsEvaluating(false);
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : '후보 매물을 저장하지 못했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!analysisId || !activePlan) {
      setError('임시 저장할 매물을 먼저 추가해 주세요.');
      return;
    }

    const request = valuesToPartialRequest(activePlan);
    if (Object.keys(request).length === 0) {
      setError('임시 저장할 내용을 먼저 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSaveMessage('');
    try {
      const saved = await updateHousingPlan(
        analysisId,
        activePlan.propertyId,
        request,
      );
      const savedValues = planToValues(saved);
      setPlans((current) =>
        current.map((plan) =>
          plan.propertyId === savedValues.propertyId ? savedValues : plan,
        ),
      );
      setSaveMessage('현재 매물의 입력 내용을 저장했습니다.');
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : '후보 매물을 임시 저장하지 못했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="analysis-page">
      <AnalysisHeader
        onExit={onExit}
        saveStatus={
          isEvaluating
            ? '분석 중...'
            : isSaving
              ? '저장 중...'
            : analysisId
              ? undefined
              : '입력 화면 미리보기'
        }
      />
      <div
        className={`analysis-shell${isEvaluating ? ' analysis-shell--full' : ''}`}
      >
        {isEvaluating ? null : (
          <StepSidebar currentStep={3} />
        )}
        <main className="analysis-content">
          {isLoading ? (
            <div className="page-state" role="status">
              <span className="loading-spinner" />
              후보 매물을 불러오는 중입니다.
            </div>
          ) : isEvaluating ? (
            <div className="page-state evaluation-loading" role="status">
              <span className="loading-spinner" />
              <strong>분석 결과를 만드는 중입니다.</strong>
              <p>
                입력한 매물의 재무 적합성과 가격 적정성을 분석하고
                있어요.
              </p>
            </div>
          ) : (
            <form
              className="cash-flow-form housing-plans-form"
              onSubmit={handleSubmit}
            >
              <section className="form-main">
                <div className="page-heading housing-heading">
                  <div>
                    <span>STEP 3</span>
                    <h1>후보 매물과 자금 계획을 입력해 주세요</h1>
                    <p>
                      매물별 계약 조건, 대출과 입주 비용을 입력합니다.
                    </p>
                  </div>
                  <button
                    className="button button--secondary add-property-button"
                    onClick={addPlan}
                    type="button"
                  >
                    + 후보 매물 추가
                  </button>
                </div>

                <div className="property-tabs" role="tablist">
                  {plans.map((plan, index) => (
                    <div className="property-tab" key={plan.propertyId}>
                      <button
                        aria-selected={plan.propertyId === activeId}
                        className={
                          plan.propertyId === activeId
                            ? 'property-tab__select is-active'
                            : 'property-tab__select'
                        }
                        onClick={() => setActiveId(plan.propertyId)}
                        role="tab"
                        type="button"
                      >
                        {plan.name || `매물 ${index + 1}`}
                      </button>
                      <button
                        aria-label={`${plan.name || `매물 ${index + 1}`} 삭제`}
                        className="property-tab__delete"
                        disabled={plans.length === 1}
                        onClick={() => removePlan(plan)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {activePlan ? (
                  <div className="housing-sections">
                    <section className="form-card housing-section">
                      <div className="housing-section__title">
                        <div>
                          <HomeIcon />
                          <h2>매물 기본정보</h2>
                        </div>
                      </div>
                      <div className="housing-field-grid">
                        <TextField
                          id="property-name"
                          label="매물 이름"
                          onChange={(value) => updateActive('name', value)}
                          placeholder="예: 역삼 원룸"
                          value={activePlan.name}
                        />
                        <TextField
                          id="property-city"
                          label="시/도"
                          onChange={(value) => updateActive('city', value)}
                          placeholder="예: 부산시"
                          value={activePlan.city}
                        />
                        <TextField
                          id="property-district"
                          label="시/군/구"
                          onChange={(value) => updateActive('district', value)}
                          placeholder="예: 동구"
                          value={activePlan.district}
                        />
                        <TextField
                          id="property-neighborhood"
                          label="읍/면/동"
                          onChange={(value) =>
                            updateActive('neighborhood', value)
                          }
                          placeholder="예: 수정동"
                          value={activePlan.neighborhood}
                        />
                        <div className="form-field">
                          <label htmlFor="property-type">주택 유형</label>
                          <select
                            className="text-input"
                            id="property-type"
                            onChange={(event) =>
                              updateActive('propertyType', event.target.value)
                            }
                            value={activePlan.propertyType}
                          >
                            <option disabled value="">선택해 주세요</option>
                            <option value="apartment">아파트</option>
                            <option value="row_house">
                              연립·다세대
                            </option>
                            <option value="officetel">오피스텔</option>
                            <option value="detached_house">
                              단독·다가구
                            </option>
                          </select>
                        </div>
                        <div className="area-field">
                          <TextField
                            id="exclusive-area"
                            label="전용면적(㎡)"
                            onChange={(value) =>
                              updateActive(
                                'exclusiveArea',
                                value.replace(/[^\d.]/g, ''),
                              )
                            }
                            placeholder="예: 20"
                            value={activePlan.exclusiveArea}
                          />
                          <p className="area-conversion" aria-live="polite">
                            {activePlan.exclusiveArea &&
                            Number(activePlan.exclusiveArea) > 0
                              ? `약 ${(Number(activePlan.exclusiveArea) / 3.3058).toFixed(1)}평`
                              : '면적을 입력하면 평수를 알려드려요.'}
                          </p>
                        </div>
                        <div className="form-field">
                          <label htmlFor="housing-type">계약 유형</label>
                          <select
                            className="text-input"
                            id="housing-type"
                            onChange={(event) =>
                              updateActive(
                                'housingType',
                                event.target.value as HousingType,
                              )
                            }
                            value={activePlan.housingType}
                          >
                            <option disabled value="">선택해 주세요</option>
                            <option value="monthly_rent">월세</option>
                            <option value="jeonse">전세</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    <section className="form-card housing-section">
                      <h2>매물 세부정보</h2>
                      {activePlan.housingType === 'jeonse' ? (
                        <p className="housing-type-guide">
                          전세 계약은 전체 전세금을 ‘전세보증금’에 입력해
                          주세요. 월세는 0원으로 처리됩니다.
                        </p>
                      ) : null}
                      <div className="housing-cost-grid">
                        <CurrencyInput
                          id="deposit"
                          label={
                            activePlan.housingType === 'jeonse'
                              ? '전세보증금'
                              : '보증금'
                          }
                          onChange={(value) => updateActive('deposit', value)}
                          value={activePlan.deposit}
                        />
                        <CurrencyInput
                          disabled={activePlan.housingType === 'jeonse'}
                          id="monthly-rent"
                          label="월세"
                          onChange={(value) =>
                            updateActive('monthlyRent', value)
                          }
                          value={
                            activePlan.housingType === 'jeonse'
                              ? '0'
                              : activePlan.monthlyRent
                          }
                        />
                        <CurrencyInput
                          id="maintenance-fee"
                          label="관리비"
                          onChange={(value) =>
                            updateActive('maintenanceFee', value)
                          }
                          value={activePlan.maintenanceFee}
                        />
                        <CurrencyInput
                          id="utilities"
                          label="월 공과금"
                          onChange={(value) => updateActive('utilities', value)}
                          value={activePlan.utilities}
                        />
                        <CurrencyInput
                          id="transportation-cost"
                          label="월 교통비"
                          onChange={(value) =>
                            updateActive('transportationCost', value)
                          }
                          value={activePlan.transportationCost}
                        />
                      </div>
                      <div className="form-field housing-memo-field housing-detail-memo">
                        <label htmlFor="property-memo">매물 메모 (선택)</label>
                        <textarea
                          className="text-input housing-memo-input"
                          id="property-memo"
                          maxLength={2000}
                          onChange={(event) =>
                            updateActive('memo', event.target.value)
                          }
                          placeholder="예: 역세권, 엘리베이터 있음, 채광 좋음"
                          rows={4}
                          value={activePlan.memo}
                        />
                        <span className="housing-memo-count">
                          {activePlan.memo.length.toLocaleString('ko-KR')} / 2,000자
                        </span>
                      </div>
                    </section>

                    <div className="housing-bottom-grid">
                      <section className="form-card housing-section">
                        <div className="loan-section-heading">
                          <div>
                            <h2>보증금 대출</h2>
                            <p>
                              만기일시상환 기준으로, 대출원금은 만기에
                              상환하고 분석에는 월 이자만 반영합니다.
                            </p>
                          </div>
                          <label className="loan-toggle">
                            <input
                              checked={activePlan.hasDepositLoan}
                              onChange={(event) => {
                                updateActive(
                                  'hasDepositLoan',
                                  event.target.checked,
                                );
                                if (!event.target.checked) {
                                  updateActive('depositLoanAmount', '');
                                  updateActive('annualInterestRate', '');
                                }
                              }}
                              type="checkbox"
                            />
                            대출 이용
                          </label>
                        </div>
                        <div className="goal-field-list">
                          <CurrencyInput
                            disabled={!activePlan.hasDepositLoan}
                            id="deposit-loan-amount"
                            label="보증금 대출 예정액"
                            onChange={(value) =>
                              updateActive('depositLoanAmount', value)
                            }
                            value={activePlan.depositLoanAmount}
                          />
                          <TextField
                            disabled={!activePlan.hasDepositLoan}
                            id="annual-interest-rate"
                            label="연이자율(%)"
                            onChange={(value) =>
                              updateActive(
                                'annualInterestRate',
                                value.replace(/[^\d.]/g, ''),
                              )
                            }
                            placeholder="예: 3.5"
                            value={activePlan.annualInterestRate}
                          />
                        </div>
                      </section>
                      <section className="form-card housing-section">
                        <h2>초기 입주비용</h2>
                        <div className="goal-field-list">
                          <CurrencyInput
                            id="brokerage-fee"
                            label="중개보수"
                            onChange={(value) =>
                              updateActive('brokerageFee', value)
                            }
                            value={activePlan.brokerageFee}
                          />
                          <CurrencyInput
                            id="moving-cost"
                            label="이사비"
                            onChange={(value) =>
                              updateActive('movingCost', value)
                            }
                            value={activePlan.movingCost}
                          />
                          <CurrencyInput
                            id="other-move-in-cost"
                            label="기타 입주비"
                            onChange={(value) =>
                              updateActive('otherMoveInCost', value)
                            }
                            value={activePlan.otherMoveInCost}
                          />
                        </div>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="empty-properties">
                    후보 매물을 추가해 주세요.
                  </div>
                )}
              </section>

              <aside className="input-summary housing-summary">
                <h2>선택 매물 요약</h2>
                <dl>
                  <div>
                    <dt>현재 매물</dt>
                    <dd>{activePlan?.name || '미입력'}</dd>
                  </div>
                  <div>
                    <dt>보증금</dt>
                    <dd>{activePlan?.deposit || '0'}만 원</dd>
                  </div>
                  <div>
                    <dt>대출 예정액</dt>
                    <dd>{activePlan?.depositLoanAmount || '0'}만 원</dd>
                  </div>
                  <div>
                    <dt>월 주거·교통비</dt>
                    <dd>{Math.round(monthlyHousingCost)}만 원</dd>
                  </div>
                </dl>
                <div className="summary-total">
                  <span>예상 초기 필요자금</span>
                  <strong>
                    {initialRequiredFunds.toLocaleString('ko-KR')}만 원
                  </strong>
                </div>
              </aside>

              <footer className="form-navigation">
                <button
                  className="button button--secondary"
                  onClick={onPrevious}
                  type="button"
                >
                  이전
                </button>
                <div>
                  {error ? (
                    <p className="form-navigation__error" role="alert">
                      {error}
                    </p>
                  ) : null}
                  {saveMessage ? (
                    <p className="form-navigation__success" role="status">
                      {saveMessage}
                    </p>
                  ) : null}
                  <button
                    className="button button--secondary"
                    disabled={isSaving}
                    onClick={saveDraft}
                    type="button"
                  >
                    임시 저장
                  </button>
                  <button
                    className="button button--primary"
                    disabled={isSaving}
                    type="submit"
                  >
                    {isSaving ? '저장 중...' : '분석하기'}
                    <ArrowRightIcon />
                  </button>
                </div>
              </footer>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
