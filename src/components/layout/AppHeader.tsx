import { HomeIcon } from '../ui/Icons';

interface AppHeaderProps {
  onStart?: () => void;
}

export function AppHeader({ onStart }: AppHeaderProps) {
  return (
    <header className="app-header">
      <a className="app-header__brand" href="/" aria-label="홈으로 이동">
        <HomeIcon className="app-header__logo" />
        <span>청년 주거 금융 도우미</span>
      </a>
      <nav aria-label="주요 메뉴" className="app-header__nav">
        <a href="#service-flow">서비스 소개</a>
        <button className="button button--small" onClick={onStart} type="button">
          분석 시작
        </button>
      </nav>
    </header>
  );
}
