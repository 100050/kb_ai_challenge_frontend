export interface CashFlow {
  after_tax_monthly_income: number | null;
  monthly_living_expenses_excluding_housing_and_transport: number | null;
  existing_loan_monthly_payment: number | null;
}

export interface FinancialGoals {
  target_monthly_savings: number | null;
  monthly_safety_margin: number | null;
  available_cash: number | null;
  minimum_emergency_fund: number | null;
  recoverable_existing_rental_deposit: number | null;
}

export interface Analysis {
  analysis_id: string;
  status: 'draft' | 'evaluating' | 'completed' | 'failed';
  current_step:
    | 'cash_flow'
    | 'financial_goals'
    | 'housing_plan'
    | 'confirmation';
  progress: number;
  cash_flow: CashFlow | null;
  financial_goals: FinancialGoals | null;
  housing_plans: unknown[];
  created_at: string;
  updated_at: string;
}

export interface AnalysisCreateResponse {
  analysis_id: string;
  status: 'draft';
  current_step: 'cash_flow';
  progress: number;
  created_at: string;
}

export interface CashFlowUpdateResponse {
  analysis_id: string;
  cash_flow: CashFlow;
  current_step: 'financial_goals';
  progress: number;
}

export interface FinancialGoalsUpdateResponse {
  analysis_id: string;
  financial_goals: FinancialGoals;
  current_step: 'housing_plan';
  progress: number;
}

export type HousingType = 'jeonse' | 'monthly_rent';

export interface LoanPlan {
  deposit_loan_amount: number;
  annual_interest_rate: number;
}

export interface AdditionalCosts {
  brokerage_fee: number;
  moving_cost: number;
  other_move_in_cost: number;
}

export interface HousingPlan {
  analysis_id?: string;
  property_id: string;
  name: string | null;
  address: string | null;
  property_type: string | null;
  legal_dong_code: string | null;
  exclusive_area_m2: number | null;
  housing_type: HousingType | null;
  deposit: number | null;
  monthly_rent: number | null;
  maintenance_fee: number | null;
  utilities: number | null;
  transportation_cost: number | null;
  loan_plan: LoanPlan | null;
  additional_costs: AdditionalCosts | null;
  is_complete: boolean;
  created_at?: string;
  updated_at: string;
}

export interface HousingPlanSummary {
  property_id: string;
  name: string | null;
  housing_type: HousingType | null;
  is_complete: boolean;
  updated_at: string;
}

export type InitialFundsStatus =
  | 'insufficient_initial_funds'
  | 'emergency_fund_shortfall'
  | 'sufficient';

export type MonthlyCashFlowStatus =
  | 'essential_expense_deficit'
  | 'savings_target_shortfall'
  | 'safety_margin_shortfall'
  | 'sufficient';

export type AnnualGoalStatus = 'below_target' | 'target_met' | 'above_target';

export interface PriceComparisonSample {
  name: string | null;
  address: string | null;
  deposit: number;
  monthly_rent: number;
  exclusive_area_m2: number;
  contract_date: string;
  equivalent_monthly_cost: number;
}

export interface AnalysisCandidateResult {
  property_id: string;
  name: string;
  initial_funds: {
    initial_cash_required: number;
    post_move_liquid_assets: number;
    emergency_fund_gap: number;
    status: InitialFundsStatus;
  };
  monthly_cash_flow: {
    monthly_housing_and_transport_cost: number;
    actual_monthly_balance: number;
    monthly_budget_margin: number;
    status: MonthlyCashFlowStatus;
  };
  annual_goal: {
    annual_financial_target: number;
    expected_resources_after_one_year: number;
    annual_financial_surplus: number;
    annual_goal_achievement_rate: number;
    status: AnnualGoalStatus;
  };
  price_appropriateness: {
    status: 'available' | 'unavailable';
    sample_count: number;
    comparison_mode: 'median' | 'individual_samples' | null;
    median_equivalent_monthly_cost: number | null;
    difference_from_median: number | null;
    difference_rate_from_median: number | null;
    price_percentile: number | null;
    candidate_equivalent_monthly_cost: number | null;
    samples: PriceComparisonSample[];
    reason: string | null;
  };
  calculation_details: unknown;
  warnings: string[];
}

export interface AnalysisResult {
  analysis_id: string;
  candidates: AnalysisCandidateResult[];
  generated_at: string;
}

export interface EvaluationResponse {
  evaluation_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
}
