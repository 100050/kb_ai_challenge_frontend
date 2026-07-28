# 프론트엔드 프로젝트 구조

## 기본 구조

```text
frontend/
├── public/
├── image/                              # 원본 디자인 참고 이미지
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── api/
│   │   ├── httpClient.ts               # Base URL, JSON, 공통 오류 처리
│   │   ├── apiError.ts
│   │   └── generatedTypes.ts           # API 공통 타입
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AnalysisLayout.tsx
│   │   │   ├── StepSidebar.tsx
│   │   │   └── BottomNavigation.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── CurrencyInput.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── WarningCallout.tsx
│   │   └── feedback/
│   │       ├── LoadingState.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorState.tsx
│   │
│   ├── features/
│   │   ├── analysis/
│   │   │   ├── api/
│   │   │   │   ├── analysisApi.ts
│   │   │   │   └── evaluationApi.ts
│   │   │   ├── components/
│   │   │   │   ├── AnalysisProgress.tsx
│   │   │   │   └── InputSummary.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAnalysis.ts
│   │   │   │   └── useAnalysisNavigation.ts
│   │   │   ├── model/
│   │   │   │   ├── analysisTypes.ts
│   │   │   │   ├── analysisMapper.ts
│   │   │   │   └── analysisValidation.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── cash-flow/                  # 1단계: 소득·생활비
│   │   │   ├── CashFlowForm.tsx
│   │   │   ├── cashFlowSchema.ts
│   │   │   └── cashFlowTypes.ts
│   │   │
│   │   ├── financial-goals/            # 2단계: 자산·재무목표
│   │   │   ├── FinancialGoalsForm.tsx
│   │   │   ├── financialGoalsSchema.ts
│   │   │   └── financialGoalsTypes.ts
│   │   │
│   │   ├── housing-plans/              # 3단계: 후보 매물+대출+추가비용
│   │   │   ├── api/
│   │   │   │   └── housingPlanApi.ts
│   │   │   ├── components/
│   │   │   │   ├── PropertyTabs.tsx
│   │   │   │   ├── PropertyForm.tsx
│   │   │   │   ├── LoanPlanForm.tsx
│   │   │   │   └── AdditionalCostsForm.tsx
│   │   │   ├── model/
│   │   │   │   ├── housingPlanTypes.ts
│   │   │   │   └── housingPlanValidation.ts
│   │   │   └── hooks/
│   │   │       └── useHousingPlans.ts
│   │   │
│   │   ├── results/
│   │   │   ├── components/
│   │   │   │   ├── CandidateResult.tsx
│   │   │   │   ├── InitialFundsCard.tsx
│   │   │   │   ├── MonthlyCashFlowCard.tsx
│   │   │   │   ├── AnnualGoalCard.tsx
│   │   │   │   └── ResultWarning.tsx
│   │   │   ├── resultTypes.ts
│   │   │   └── resultPresentation.ts   # 상태 문구·색상·판단 우선순위
│   │   │
│   │   └── chat/
│   │       ├── api/
│   │       │   └── chatApi.ts           # SSE 연결 및 이벤트 변환
│   │       ├── components/
│   │       │   ├── ConversationList.tsx
│   │       │   ├── ChatMessage.tsx
│   │       │   ├── ChatComposer.tsx
│   │       │   └── AnalysisSummary.tsx
│   │       ├── hooks/
│   │       │   └── useChatStream.ts
│   │       └── chatTypes.ts
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── CashFlowPage.tsx
│   │   ├── FinancialGoalsPage.tsx
│   │   ├── HousingPlansPage.tsx
│   │   ├── ResultsPage.tsx
│   │   ├── ChatPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── styles/
│   │   ├── tokens.css                   # 디자인 토큰의 CSS 변수
│   │   ├── global.css
│   │   └── utilities.css
│   │
│   ├── test/
│   │   ├── setup.ts
│   │   ├── server.ts                    # MSW 테스트 서버
│   │   ├── handlers.ts
│   │   └── renderWithProviders.tsx
│   │
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env.example
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 화면 흐름과 라우트

최종 확인 화면은 두지 않는다. 3단계 입력을 완료하면 평가 API를 호출하고 결과 화면으로 이동한다.

| 경로 | 화면 |
| --- | --- |
| `/` | 시작 화면 |
| `/analyses/:analysisId/cash-flow` | 1단계 소득·생활비 |
| `/analyses/:analysisId/financial-goals` | 2단계 자산·재무목표 |
| `/analyses/:analysisId/housing-plans` | 3단계 후보 매물·대출·추가비용 |
| `/analyses/:analysisId/results` | 최종 결과 |
| `/analyses/:analysisId/chat` | AI 상담 챗봇 |

## 디렉터리 책임

- `pages/`는 라우트 단위 데이터 로딩과 화면 조립을 담당한다.
- `features/`는 분석 입력, 결과, 챗봇 등 도메인 워크플로를 담당한다.
- `components/`는 여러 기능에서 재사용하는 레이아웃과 UI 요소를 제공한다.
- `api/`는 Base URL, JSON 변환, 공통 오류처럼 전체 API에 공통인 처리를 담당한다.
- 기능 전용 API와 타입은 해당 `features/` 하위에 둔다.
- `styles/tokens.css`는 `KB_Housing_AI_Design_Tokens.md`의 색상, 타이포그래피, 간격을 CSS 변수로 제공한다.
- 테스트는 구현 파일 옆에 `*.test.ts` 또는 `*.test.tsx`로 두며, 공통 테스트 설정만 `src/test/`에서 관리한다.

## 상태 및 데이터 관리

- 서버가 발급한 `analysis_id`를 전체 입력 흐름의 기준으로 사용한다.
- 저장된 분석 데이터는 API에서 다시 조회하고, 아직 저장하지 않은 폼 값만 컴포넌트 로컬 상태로 관리한다.
- 별도 전역 상태 라이브러리는 초기 구현에 추가하지 않는다.
- 3단계에서는 매물, 대출 계획, 추가비용을 하나의 `housing plan` 단위로 관리한다.
- 각 매물 작업에는 `analysis_id`와 `property_id`를 함께 사용한다.
- API 호출은 프레젠테이션 컴포넌트에 직접 작성하지 않는다.

## 최종 결과 구성

결과 화면은 추천이나 임의 순위를 제공하지 않고 매물별로 다음 세 카드만 표시한다.

1. 초기자금 및 유동성
2. 월 현금흐름
3. 1년 재무목표

API 결과의 `initial_funds`, `monthly_cash_flow`, `annual_goal`, `warnings`를 각 카드와 경고 영역에 대응시킨다. 상태 문구, 의미 색상, 판단 우선순위는 `resultPresentation.ts`에서 일관되게 변환한다.

판단 표시는 다음 우선순위를 따른다.

1. 초기자금 부족 여부
2. 최소 비상자금 유지 여부
3. 필수 월 현금흐름 적자 여부
4. 목표저축 유지 여부
5. 월 안전여유 충족 여부
6. 1년 재무목표 달성률

초기자금이 부족해도 나머지 계산값은 표시하되, 계약 체결을 가정한 참고값이라는 경고를 함께 표시한다.

## 구현 기준

- React, TypeScript, Vite, npm을 사용한다.
- TypeScript strict 모드와 2칸 들여쓰기를 적용한다.
- 개발 API Base URL은 Vite 환경 변수로 설정하고 기본값은 `http://localhost:8080/api/v1`로 둔다.
- Vitest, React Testing Library, MSW로 사용자 관점의 동작과 네트워크 경계를 테스트한다.
- 로딩, 오류, 빈 상태, 입력 검증, 저장 성공을 테스트한다.
- 챗봇은 SSE 연결, 증분 메시지, 오류, 종료 및 재연결 동작을 테스트한다.
- 색상, 글꼴, 테두리와 상태 표현은 `KB_Housing_AI_Design_Tokens.md`를 기준으로 한다.
