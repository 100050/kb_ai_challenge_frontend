import { BrandLogo } from '../ui/BrandLogo';

interface AnalysisHeaderProps {
  saveStatus?: string;
  onExit: () => void;
}

export function AnalysisHeader({
  onExit,
  saveStatus,
}: AnalysisHeaderProps) {
  return (
    <header className="analysis-header">
      <a className="analysis-header__brand" href="/" aria-label="홈으로 이동">
        <BrandLogo />
      </a>
      <div className="analysis-header__actions">
        {saveStatus ? <span>{saveStatus}</span> : null}
        <button onClick={onExit} type="button">
          나가기
        </button>
      </div>
    </header>
  );
}
