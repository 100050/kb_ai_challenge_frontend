import { FormEvent, useEffect, useMemo, useState } from 'react';

import { ApiError } from '../api/httpClient';
import { AnalysisHeader } from '../components/layout/AnalysisHeader';
import { StepSidebar } from '../components/layout/StepSidebar';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ArrowRightIcon, WalletIcon } from '../components/ui/Icons';
import {
  getAnalysis,
  updateCashFlow,
} from '../features/analysis/api/analysisApi';
import type { CashFlow } from '../features/analysis/model/analysisTypes';

interface CashFlowPageProps {
  analysisId?: string;
  onExit?: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface CashFlowFormValues {
  income: string;
  livingExpenses: string;
  existingLoanPayment: string;
}

type CashFlowFormErrors = Partial<Record<keyof CashFlowFormValues, string>>;

const emptyValues: CashFlowFormValues = {
  income: '',
  livingExpenses: '',
  existingLoanPayment: '',
};

function wonToManwon(value: number) {
  return String(value / 10_000);
}

function valuesToCashFlow(values: CashFlowFormValues): CashFlow {
  return {
    after_tax_monthly_income: Number(values.income) * 10_000,
    monthly_living_expenses_excluding_housing_and_transport:
      Number(values.livingExpenses) * 10_000,
    existing_loan_monthly_payment:
      Number(values.existingLoanPayment) * 10_000,
  };
}

function validate(values: CashFlowFormValues): CashFlowFormErrors {
  const errors: CashFlowFormErrors = {};

  for (const key of Object.keys(values) as (keyof CashFlowFormValues)[]) {
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

export function CashFlowPage({
  analysisId,
  onExit,
  onNext,
  onPrevious,
}: CashFlowPageProps) {
  const [values, setValues] = useState<CashFlowFormValues>(emptyValues);
  const [errors, setErrors] = useState<CashFlowFormErrors>({});
  const [isLoading, setIsLoading] = useState(Boolean(analysisId));
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!analysisId) {
      return;
    }

    const controller = new AbortController();

    getAnalysis(analysisId, controller.signal)
      .then((analysis) => {
        if (analysis.cash_flow) {
          setValues({
            income: wonToManwon(analysis.cash_flow.after_tax_monthly_income),
            livingExpenses: wonToManwon(
              analysis.cash_flow
                .monthly_living_expenses_excluding_housing_and_transport,
            ),
            existingLoanPayment: wonToManwon(
              analysis.cash_flow.existing_loan_monthly_payment,
            ),
          });
        } else {
          setValues(emptyValues);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setLoadError(
          error instanceof ApiError
            ? error.message
            : '저장된 입력 정보를 불러오지 못했습니다.',
        );
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [analysisId, reloadKey]);

  const retryLoad = () => {
    setIsLoading(true);
    setLoadError('');
    setReloadKey((key) => key + 1);
  };

  const totalMonthlyOutflow = useMemo(() => {
    if (!values.livingExpenses || !values.existingLoanPayment) {
      return null;
    }

    return Number(values.livingExpenses) + Number(values.existingLoanPayment);
  }, [values.existingLoanPayment, values.livingExpenses]);

  const updateValue = (key: keyof CashFlowFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaveError('');
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
        await updateCashFlow(analysisId, valuesToCashFlow(values));
      }
      onNext();
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : '입력 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
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
              ? '서버에 안전하게 저장됩니다'
              : '입력 화면 미리보기'
        }
      />
      <div className="analysis-shell">
        <StepSidebar currentStep={1} progress={33} />
        <main className="analysis-content">
          {isLoading ? (
            <div className="page-state" role="status">
              <span className="loading-spinner" />
              저장된 입력 정보를 불러오는 중입니다.
            </div>
          ) : loadError ? (
            <div className="page-state page-state--error" role="alert">
              <strong>입력 정보를 불러오지 못했습니다.</strong>
              <p>{loadError}</p>
              <button
                className="button"
                onClick={retryLoad}
                type="button"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <form className="cash-flow-form" onSubmit={handleSubmit}>
              <section className="form-main">
                <div className="page-heading">
                  <span>STEP 1</span>
                  <h1>소득과 생활비를 입력해 주세요</h1>
                  <p>
                    입주 후에도 반복되는 월 현금유입과 지출을 확인합니다.
                  </p>
                </div>

                <div className="form-card">
                  <div className="form-card__heading">
                    <WalletIcon />
                    <div>
                      <h2>월 현금흐름</h2>
                      <p>실제 통장에 들어오고 나가는 금액을 입력해 주세요.</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <CurrencyInput
                      autoFocus
                      error={errors.income}
                      id="income"
                      label="세후 월 소득"
                      onChange={(value) => updateValue('income', value)}
                      placeholder="예: 350"
                      value={values.income}
                    />
                    <CurrencyInput
                      error={errors.livingExpenses}
                      id="living-expenses"
                      label="월 생활비"
                      onChange={(value) => updateValue('livingExpenses', value)}
                      placeholder="예: 130"
                      value={values.livingExpenses}
                    />
                    <CurrencyInput
                      error={errors.existingLoanPayment}
                      id="existing-loan-payment"
                      label="기존 대출 월 상환액"
                      onChange={(value) =>
                        updateValue('existingLoanPayment', value)
                      }
                      placeholder="대출이 없다면 0"
                      value={values.existingLoanPayment}
                    />
                  </div>

                  <div className="form-callout">
                    <span aria-hidden="true">i</span>
                    <p>
                      월 생활비에는 새 매물의 주거비와 교통비를 제외해 주세요.
                      해당 비용은 3단계에서 매물별로 입력합니다.
                    </p>
                  </div>
                </div>
              </section>

              <aside className="input-summary" aria-label="현재 입력 요약">
                <h2>입력 현황</h2>
                <dl>
                  <div>
                    <dt>세후 월 소득</dt>
                    <dd>{formatManwon(values.income)}</dd>
                  </div>
                  <div>
                    <dt>월 생활비</dt>
                    <dd>{formatManwon(values.livingExpenses)}</dd>
                  </div>
                  <div>
                    <dt>기존 대출 상환액</dt>
                    <dd>{formatManwon(values.existingLoanPayment)}</dd>
                  </div>
                </dl>
                <div className="summary-total">
                  <span>현재 월 고정지출</span>
                  <strong>
                    {totalMonthlyOutflow === null
                      ? '계산 대기'
                      : `${totalMonthlyOutflow.toLocaleString('ko-KR')}만 원`}
                  </strong>
                </div>
                <div className="summary-tip">
                  다음 단계에서 자산과 재무목표를 입력합니다.
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
                  <button
                    className="button button--primary"
                    disabled={isSaving}
                    type="submit"
                  >
                    {isSaving ? '저장 중...' : '저장하고 다음'}
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
