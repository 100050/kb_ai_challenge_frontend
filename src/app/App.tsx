import { useEffect, useState } from 'react';

import { LandingPage } from '../pages/LandingPage';
import { CashFlowPage } from '../pages/CashFlowPage';
import { FinancialGoalsPage } from '../pages/FinancialGoalsPage';
import { HousingPlansPage } from '../pages/HousingPlansPage';
import { ResultsPage } from '../pages/ResultsPage';

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  const cashFlowMatch = pathname.match(
    /^\/analyses\/([^/]+)\/cash-flow$/,
  );
  const financialGoalsMatch = pathname.match(
    /^\/analyses\/([^/]+)\/financial-goals$/,
  );
  const housingPlansMatch = pathname.match(
    /^\/analyses\/([^/]+)\/housing-plans$/,
  );
  const resultsMatch = pathname.match(/^\/analyses\/([^/]+)\/results$/);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (cashFlowMatch) {
    const analysisId = decodeURIComponent(cashFlowMatch[1]);

    return (
      <CashFlowPage
        analysisId={analysisId}
        onExit={() => navigate('/')}
        onNext={() =>
          navigate(`/analyses/${analysisId}/financial-goals`)
        }
        onPrevious={() => navigate('/')}
      />
    );
  }

  if (pathname === '/cash-flow') {
    return (
      <CashFlowPage
        onExit={() => navigate('/')}
        onNext={() => navigate('/financial-goals')}
        onPrevious={() => navigate('/')}
      />
    );
  }

  if (financialGoalsMatch) {
    const analysisId = decodeURIComponent(financialGoalsMatch[1]);

    return (
      <FinancialGoalsPage
        analysisId={analysisId}
        onExit={() => navigate('/')}
        onNext={() => navigate(`/analyses/${analysisId}/housing-plans`)}
        onPrevious={() => navigate(`/analyses/${analysisId}/cash-flow`)}
      />
    );
  }

  if (pathname === '/financial-goals') {
    return (
      <FinancialGoalsPage
        onExit={() => navigate('/')}
        onNext={() => navigate('/housing-plans')}
        onPrevious={() => navigate('/cash-flow')}
      />
    );
  }

  if (housingPlansMatch) {
    const analysisId = decodeURIComponent(housingPlansMatch[1]);

    return (
      <HousingPlansPage
        analysisId={analysisId}
        onExit={() => navigate('/')}
        onNext={() => navigate(`/analyses/${analysisId}/results`)}
        onPrevious={() =>
          navigate(`/analyses/${analysisId}/financial-goals`)
        }
      />
    );
  }

  if (pathname === '/housing-plans') {
    return (
      <HousingPlansPage
        onExit={() => navigate('/')}
        onNext={() => navigate('/results')}
        onPrevious={() => navigate('/financial-goals')}
      />
    );
  }

  if (resultsMatch) {
    const analysisId = decodeURIComponent(resultsMatch[1]);

    return (
      <ResultsPage
        analysisId={analysisId}
        onExit={() => navigate('/')}
        onPrevious={() => navigate(`/analyses/${analysisId}/housing-plans`)}
      />
    );
  }

  if (pathname === '/results') {
    return (
      <ResultsPage
        onExit={() => navigate('/')}
        onPrevious={() => navigate('/housing-plans')}
      />
    );
  }

  const handleStart = () => {
    navigate('/cash-flow');
  };

  return <LandingPage onStart={handleStart} />;
}
