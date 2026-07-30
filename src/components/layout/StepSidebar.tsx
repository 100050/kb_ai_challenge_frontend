const steps = [
  { number: 1, title: '소득·생활비' },
  { number: 2, title: '자산·재무목표' },
  { number: 3, title: '후보 매물·대출·비용' },
];

interface StepSidebarProps {
  currentStep: number;
  progress: number;
}

export function StepSidebar({ currentStep, progress }: StepSidebarProps) {
  return (
    <aside className="step-sidebar" aria-label="분석 입력 단계">
      <div className="step-sidebar__progress">
        <div>
          <span>입력 진행률</span>
          <strong>{progress}%</strong>
        </div>
        <div
          aria-label={`입력 진행률 ${progress}%`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="progress-track"
          role="progressbar"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ol className="analysis-steps">
        {steps.map((step) => {
          const state =
            step.number < currentStep
              ? 'complete'
              : step.number === currentStep
                ? 'current'
                : 'upcoming';

          return (
            <li className={`analysis-step analysis-step--${state}`} key={step.number}>
              <span className="analysis-step__marker">
                {state === 'complete' ? '✓' : step.number}
              </span>
              <div>
                <strong>
                  {step.number}. {step.title}
                </strong>
                <span>
                  {state === 'complete'
                    ? '완료'
                    : state === 'current'
                      ? '입력 중'
                      : '입력 대기'}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
