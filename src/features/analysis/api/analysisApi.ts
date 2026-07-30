import { requestJson } from '../../../api/httpClient';
import type {
  Analysis,
  AnalysisCreateResponse,
  AnalysisResult,
  CashFlow,
  CashFlowUpdateResponse,
  EvaluationResponse,
  FinancialGoals,
  FinancialGoalsUpdateResponse,
  HousingPlan,
  HousingPlanSummary,
} from '../model/analysisTypes';

export function createAnalysis() {
  return requestJson<AnalysisCreateResponse>('/analyses', {
    method: 'POST',
  });
}

export function getAnalysis(analysisId: string, signal?: AbortSignal) {
  return requestJson<Analysis>(`/analyses/${analysisId}`, { signal });
}

export function updateCashFlow(
  analysisId: string,
  cashFlow: Partial<CashFlow>,
) {
  return requestJson<CashFlowUpdateResponse>(
    `/analyses/${analysisId}/cash-flow`,
    {
      method: 'PATCH',
      body: JSON.stringify(cashFlow),
    },
  );
}

export function updateFinancialGoals(
  analysisId: string,
  financialGoals: Partial<FinancialGoals>,
) {
  return requestJson<FinancialGoalsUpdateResponse>(
    `/analyses/${analysisId}/financial-goals`,
    {
      method: 'PATCH',
      body: JSON.stringify(financialGoals),
    },
  );
}

export function getHousingPlans(analysisId: string, signal?: AbortSignal) {
  return requestJson<{ housing_plans: HousingPlanSummary[] }>(
    `/analyses/${analysisId}/housing-plans`,
    { signal },
  );
}

export function getHousingPlan(
  analysisId: string,
  propertyId: string,
  signal?: AbortSignal,
) {
  return requestJson<HousingPlan>(
    `/analyses/${analysisId}/housing-plans/${propertyId}`,
    { signal },
  );
}

export function createHousingPlan(analysisId: string) {
  return requestJson<HousingPlan>(`/analyses/${analysisId}/housing-plans`, {
    method: 'POST',
    body: '{}',
  });
}

export function updateHousingPlan(
  analysisId: string,
  propertyId: string,
  housingPlan: Partial<
    Omit<
      HousingPlan,
      | 'analysis_id'
      | 'property_id'
      | 'is_complete'
      | 'created_at'
      | 'updated_at'
    >
  >,
) {
  return requestJson<HousingPlan>(
    `/analyses/${analysisId}/housing-plans/${propertyId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(housingPlan),
    },
  );
}

export function deleteHousingPlan(analysisId: string, propertyId: string) {
  return fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/analyses/${analysisId}/housing-plans/${propertyId}`,
    { method: 'DELETE' },
  ).then((response) => {
    if (!response.ok) {
      throw new Error('매물을 삭제하지 못했습니다.');
    }
  });
}

export function getAnalysisResult(analysisId: string, signal?: AbortSignal) {
  return requestJson<AnalysisResult>(`/analyses/${analysisId}/result`, {
    signal,
  });
}

export function startEvaluation(analysisId: string) {
  return requestJson<EvaluationResponse>(
    `/analyses/${analysisId}/evaluation`,
    { method: 'POST' },
  );
}
