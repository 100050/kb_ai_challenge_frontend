const analysisIdKey = 'kb-housing-ai.analysis-id';

export function getStoredAnalysisId() {
  return window.localStorage.getItem(analysisIdKey);
}

export function storeAnalysisId(analysisId: string) {
  window.localStorage.setItem(analysisIdKey, analysisId);
}

export function clearStoredAnalysisId() {
  window.localStorage.removeItem(analysisIdKey);
}
