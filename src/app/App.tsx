import { LandingPage } from '../pages/LandingPage';

export function App() {
  const handleStart = () => {
    window.dispatchEvent(new CustomEvent('analysis:start'));
  };

  return <LandingPage onStart={handleStart} />;
}
