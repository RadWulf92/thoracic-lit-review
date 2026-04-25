import type { TrialData } from '../../types/paper';

interface TrialDataSummaryProps {
  data: TrialData;
}

export function TrialDataSummary({ data }: TrialDataSummaryProps) {
  const parts: string[] = [];

  if (data.trialName) parts.push(data.trialName);
  if (data.phase) parts.push(`Phase ${data.phase}`);
  if (data.nPatients) parts.push(`N=${data.nPatients}`);

  // Build results summary
  if (data.primaryEndpoint) {
    let result = `m${data.primaryEndpoint}`;
    if (data.medianExpArm && data.medianCtrlArm) {
      result += ` ${data.medianExpArm} vs ${data.medianCtrlArm}`;
    } else if (data.medianExpArm) {
      result += ` ${data.medianExpArm}`;
    }
    parts.push(result);
  }

  if (data.hazardRatio) parts.push(`HR ${data.hazardRatio}`);

  if (parts.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
      <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span className="truncate">{parts.join(' \u00B7 ')}</span>
    </div>
  );
}
