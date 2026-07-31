import { HomeIcon } from '../ui/Icons';

interface AppHeaderProps {
  isStarting?: boolean;
  onStart?: () => void | Promise<void>;
}

export function AppHeader({ isStarting = false, onStart }: AppHeaderProps) {
  return (
    <header className="app-header">
      <a className="app-header__brand" href="/" aria-label="홈으로 이동">
        <HomeIcon className="app-header__logo" />
        <span>가늠</span>
      </a>
      <nav aria-label="주요 메뉴" className="app-header__nav">
        <a href="#service-flow">서비스 소개</a>
        <button
          className="button button--small"
          disabled={isStarting}
          onClick={onStart}
          type="button"
        >
          {isStarting ? '발급 중...' : '분석 시작'}
        </button>
      </nav>
    </header>
  );
}
