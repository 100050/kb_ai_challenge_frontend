import { FormEvent, useEffect, useMemo, useState } from 'react';

import { ApiError } from '../api/httpClient';
import { AnalysisHeader } from '../components/layout/AnalysisHeader';
import { StepSidebar } from '../components/layout/StepSidebar';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ArrowRightIcon, TargetIcon, WalletIcon } from '../components/ui/Icons';
import {
  getAnalysis,
  updateFinancialGoals,
} from '../features/analysis/api/analysisApi';
import type { FinancialGoals } from '../features/analysis/model/analysisTypes';

interface FinancialGoalsPageProps {
  analysisId?: string;
  onExit?: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface FinancialGoalsFormValues {
  availableCash: string;
  recoverableDeposit: string;
  targetMonthlySavings: string;
  monthlySafetyMargin: string;
  minimumEmergencyFund: string;
}

type FinancialGoalsFormErrors = Partial<
  Record<keyof FinancialGoalsFormValues, string>
>;

const emptyValues: FinancialGoalsFormValues = {
  availableCash: '',
  recoverableDeposit: '',
  targetMonthlySavings: '',
  monthlySafetyMargin: '',
  minimumEmergencyFund: '',
};

function wonToManwon(value: number | null) {
  return value === null ? '' : String(value / 10_000);
}

function valuesToFinancialGoals(
  values: FinancialGoalsFormValues,
  isDepositAvailableBeforeContract: boolean,
): FinancialGoals {
  return {
    target_monthly_savings: Number(values.targetMonthlySavings) * 10_000,
    monthly_safety_margin: Number(values.monthlySafetyMargin) * 10_000,
    available_cash: Number(values.availableCash) * 10_000,
    minimum_emergency_fund: Number(values.minimumEmergencyFund) * 10_000,
    recoverable_existing_rental_deposit:
      Number(values.recoverableDeposit) * 10_000,
    existing_rental_deposit_available_before_contract:
      isDepositAvailableBeforeContract,
  };
}

function valuesToPartialFinancialGoals(
  values: FinancialGoalsFormValues,
  isDepositAvailableBeforeContract: boolean,
): Partial<FinancialGoals> {
  const goals: Partial<FinancialGoals> = {
    existing_rental_deposit_available_before_contract:
      isDepositAvailableBeforeContract,
  };
  type FinancialGoalMoneyKey = Exclude<
    keyof FinancialGoals,
    'existing_rental_deposit_available_before_contract'
  >;
  const fields: {
    formKey: keyof FinancialGoalsFormValues;
    apiKey: FinancialGoalMoneyKey;
  }[] = [
    { formKey: 'targetMonthlySavings', apiKey: 'target_monthly_savings' },
    { formKey: 'monthlySafetyMargin', apiKey: 'monthly_safety_margin' },
    { formKey: 'availableCash', apiKey: 'available_cash' },
    { formKey: 'minimumEmergencyFund', apiKey: 'minimum_emergency_fund' },
    {
      formKey: 'recoverableDeposit',
      apiKey: 'recoverable_existing_rental_deposit',
    },
  ];

  for (const { apiKey, formKey } of fields) {
    if (values[formKey] !== '') {
      goals[apiKey] = Number(values[formKey]) * 10_000;
    }
  }

  return goals;
}

function validate(
  values: FinancialGoalsFormValues,
): FinancialGoalsFormErrors {
  const errors: FinancialGoalsFormErrors = {};

  for (const key of Object.keys(values) as (keyof FinancialGoalsFormValues)[]) {
    if (values[key] === '') {
      errors[key] = '금액을 입력해 주세요.';
    }
  }

  return errors;
}

function formatManwon(value: string) {
  if (!value) {
    return '미입력';
  }

  return `${Number(value).toLocaleString('ko-KR')}만 원`;
}

export function FinancialGoalsPage({
  analysisId,
  onExit,
  onNext,
  onPrevious,
}: FinancialGoalsPageProps) {
  const [values, setValues] = useState<FinancialGoalsFormValues>(emptyValues);
  const [isDepositAvailableBeforeContract, setIsDepositAvailableBeforeContract] =
    useState(false);
  const [errors, setErrors] = useState<FinancialGoalsFormErrors>({});
  const [isLoading, setIsLoading] = useState(Boolean(analysisId));
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!analysisId) {
      return;
    }

    const controller = new AbortController();

    getAnalysis(analysisId, controller.signal)
      .then((analysis) => {
        if (analysis.financial_goals) {
          setValues({
            availableCash: wonToManwon(
              analysis.financial_goals.available_cash,
            ),
            recoverableDeposit: wonToManwon(
              analysis.financial_goals
                .recoverable_existing_rental_deposit,
            ),
            targetMonthlySavings: wonToManwon(
              analysis.financial_goals.target_monthly_savings,
            ),
            monthlySafetyMargin: wonToManwon(
              analysis.financial_goals.monthly_safety_margin,
            ),
            minimumEmergencyFund: wonToManwon(
              analysis.financial_goals.minimum_emergency_fund,
            ),
          });
          setIsDepositAvailableBeforeContract(
            analysis.financial_goals
              .existing_rental_deposit_available_before_contract ?? false,
          );
        } else {
          setValues(emptyValues);
          setIsDepositAvailableBeforeContract(false);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setLoadError(
          error instanceof ApiError
            ? error.message
            : '저장된 자산 정보를 불러오지 못했습니다.',
        );
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [analysisId, reloadKey]);

  const availableTotal = useMemo(() => {
    if (!values.availableCash || !values.recoverableDeposit) {
      return null;
    }

    return (
      Number(values.availableCash) +
      (isDepositAvailableBeforeContract
        ? Number(values.recoverableDeposit)
        : 0)
    );
  }, [
    isDepositAvailableBeforeContract,
    values.availableCash,
    values.recoverableDeposit,
  ]);

  const updateValue = (
    key: keyof FinancialGoalsFormValues,
    value: string,
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaveError('');
    setSaveMessage('');
  };

  const retryLoad = () => {
    setIsLoading(true);
    setLoadError('');
    setReloadKey((key) => key + 1);
  };

  const saveDraft = async () => {
    const partialGoals = valuesToPartialFinancialGoals(
      values,
      isDepositAvailableBeforeContract,
    );

    if (!analysisId || Object.keys(partialGoals).length === 0) {
      setSaveError('임시 저장할 내용을 먼저 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      await updateFinancialGoals(analysisId, partialGoals);
      setSaveMessage('지금까지 입력한 내용을 저장했습니다.');
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : '자산 정보를 임시 저장하지 못했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      if (analysisId) {
        await updateFinancialGoals(
          analysisId,
          valuesToFinancialGoals(
            values,
            isDepositAvailableBeforeContract,
          ),
        );
      }
      onNext();
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : '자산 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="analysis-page">
      <AnalysisHeader
        onExit={onExit ?? onPrevious}
        saveStatus={
          isSaving
            ? '저장 중...'
            : analysisId
              ? undefined
              : '입력 화면 미리보기'
        }
      />
      <div className="analysis-shell">
        <StepSidebar currentStep={2} progress={67} />
        <main className="analysis-content">
          {isLoading ? (
            <div className="page-state" role="status">
              <span className="loading-spinner" />
              저장된 자산 정보를 불러오는 중입니다.
            </div>
          ) : loadError ? (
            <div className="page-state page-state--error" role="alert">
              <strong>자산 정보를 불러오지 못했습니다.</strong>
              <p>{loadError}</p>
              <button className="button" onClick={retryLoad} type="button">
                다시 시도
              </button>
            </div>
          ) : (
            <form
              className="cash-flow-form financial-goals-form"
              onSubmit={handleSubmit}
            >
              <section className="form-main">
                <div className="page-heading">
                  <span>STEP 2</span>
                  <h1>자산과 재무목표를 입력해 주세요</h1>
                  <p>
                    보유 자산과 입주 후에도 지키고 싶은 재무 기준을
                    입력합니다.
                  </p>
                </div>

                <div className="financial-card-grid">
                  <section className="form-card financial-card">
                    <div className="form-card__heading">
                      <WalletIcon />
                      <div>
                        <h2>현재 자산</h2>
                        <p>새 계약에 실제로 활용할 수 있는 자금입니다.</p>
                      </div>
                    </div>
                    <div className="goal-field-list">
                      <CurrencyInput
                        autoFocus
                        error={errors.availableCash}
                        id="available-cash"
                        label="사용 가능 현금"
                        onChange={(value) =>
                          updateValue('availableCash', value)
                        }
                        placeholder="예: 7500"
                        value={values.availableCash}
                      />
                      <CurrencyInput
                        error={errors.recoverableDeposit}
                        id="recoverable-deposit"
                        label="기존 임차보증금 반환액"
                        onChange={(value) =>
                          updateValue('recoverableDeposit', value)
                        }
                        placeholder="없다면 0"
                        value={values.recoverableDeposit}
                      />
                      <label className="deposit-availability-check">
                        <input
                          checked={isDepositAvailableBeforeContract}
                          onChange={(event) => {
                            setIsDepositAvailableBeforeContract(
                              event.target.checked,
                            );
                            setSaveError('');
                            setSaveMessage('');
                          }}
                          type="checkbox"
                        />
                        새 계약일 전에 기존 임차보증금을 받을 수 있어요
                      </label>
                    </div>
                    <div className="asset-total">
                      <span>계약 활용 가능 총자금</span>
                      <strong>
                        {availableTotal === null
                          ? '계산 대기'
                          : `${availableTotal.toLocaleString('ko-KR')}만 원`}
                      </strong>
                    </div>
                  </section>

                  <section className="form-card financial-card">
                    <div className="form-card__heading">
                      <TargetIcon />
                      <div>
                        <h2>매월 지키고 싶은 목표</h2>
                        <p>입주 후에도 유지할 저축과 여유 기준입니다.</p>
                      </div>
                    </div>
                    <div className="goal-field-list">
                      <CurrencyInput
                        description="적금·청약 등 매월 유지할 저축 및 자산형성 금액"
                        error={errors.targetMonthlySavings}
                        id="target-monthly-savings"
                        label="월 목표저축액"
                        onChange={(value) =>
                          updateValue('targetMonthlySavings', value)
                        }
                        placeholder="예: 70"
                        value={values.targetMonthlySavings}
                      />
                      <CurrencyInput
                        description="예기치 않은 월 지출에 대비하기 위한 예산상 완충 기준"
                        error={errors.monthlySafetyMargin}
                        id="monthly-safety-margin"
                        label="월 안전여유"
                        onChange={(value) =>
                          updateValue('monthlySafetyMargin', value)
                        }
                        placeholder="예: 30"
                        value={values.monthlySafetyMargin}
                      />
                      <CurrencyInput
                        error={errors.minimumEmergencyFund}
                        id="minimum-emergency-fund"
                        label="최소 비상자금"
                        onChange={(value) =>
                          updateValue('minimumEmergencyFund', value)
                        }
                        placeholder="예: 1000"
                        value={values.minimumEmergencyFund}
                      />
                    </div>
                  </section>
                </div>

              </section>

              <aside className="input-summary" aria-label="현재 입력 요약">
                <h2>입력 현황</h2>
                <dl>
                  <div>
                    <dt>사용 가능 현금</dt>
                    <dd>{formatManwon(values.availableCash)}</dd>
                  </div>
                  <div>
                    <dt>기존 임차보증금 반환액</dt>
                    <dd>{formatManwon(values.recoverableDeposit)}</dd>
                  </div>
                  <div>
                    <dt>월 목표저축액</dt>
                    <dd>{formatManwon(values.targetMonthlySavings)}</dd>
                  </div>
                  <div>
                    <dt>월 안전여유</dt>
                    <dd>{formatManwon(values.monthlySafetyMargin)}</dd>
                  </div>
                  <div>
                    <dt>최소 비상자금</dt>
                    <dd>{formatManwon(values.minimumEmergencyFund)}</dd>
                  </div>
                </dl>
                <div className="summary-total">
                  <span>계약 활용 가능 총자금</span>
                  <strong>
                    {availableTotal === null
                      ? '계산 대기'
                      : `${availableTotal.toLocaleString('ko-KR')}만 원`}
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
                  {saveError ? (
                    <p className="form-navigation__error" role="alert">
                      {saveError}
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
                    {isSaving ? '저장 중...' : '다음 단계'}
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
