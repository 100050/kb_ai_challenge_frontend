import { HomeIcon } from '../ui/Icons';

interface AnalysisHeaderProps {
  saveStatus?: string;
  onExit: () => void;
}

export function AnalysisHeader({
  onExit,
  saveStatus = '서버에 안전하게 저장됩니다',
}: AnalysisHeaderProps) {
  return (
    <header className="analysis-header">
      <a className="analysis-header__brand" href="/" aria-label="홈으로 이동">
        <HomeIcon />
        <span>청년 주거 금융 도우미</span>
      </a>
      <div className="analysis-header__actions">
        <span>{saveStatus}</span>
        <button onClick={onExit} type="button">
          나가기
        </button>
      </div>
    </header>
  );
}
