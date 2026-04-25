import type { TrialData } from '../../types/paper';
import {
  getMedianComparison,
  getSingleMedianResult,
  getSingleOrrResult,
  getSingleRateResult,
  getOrrComparison,
  getRateComparison,
  parseHazardRatio,
  trialCompleteness,
  type ResultComparison,
  type SingleResult,
} from '../../utils/trialMetrics';

interface TrialResultsVizProps {
  data: TrialData;
  compact?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${value}%`;
  if (unit === 'mo') return `${value} mo`;
  return String(value);
}

function formatDelta(comparison: ResultComparison): string {
  const diff = comparison.experimental.value - comparison.control.value;
  const abs = Math.abs(diff);
  const direction = diff === 0
    ? 'No difference'
    : comparison.higherIsBetter
      ? diff > 0 ? 'Gain' : 'Lower'
      : diff < 0 ? 'Lower' : 'Higher';
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
  return `${direction} ${sign}${abs.toFixed(abs >= 10 ? 0 : 1)}${comparison.experimental.unit}`;
}

function ComparisonBars({ comparison }: { comparison: ResultComparison }) {
  const max = Math.max(1, comparison.experimental.value, comparison.control.value);
  const expWidth = clamp((comparison.experimental.value / max) * 100, 4, 100);
  const ctrlWidth = clamp((comparison.control.value / max) * 100, 4, 100);
  const expBetter = comparison.higherIsBetter
    ? comparison.experimental.value >= comparison.control.value
    : comparison.experimental.value <= comparison.control.value;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-800">{comparison.label}</p>
          <p className={`mt-0.5 text-[11px] font-medium ${expBetter ? 'text-emerald-700' : 'text-amber-700'}`}>
            {formatDelta(comparison)}
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          Exp vs ctrl
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-[3rem_1fr_3.25rem] items-center gap-2 text-[11px]">
          <span className="font-medium text-teal-700">Exp</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${expWidth}%` }} />
          </div>
          <span className="text-right text-gray-700">{formatValue(comparison.experimental.value, comparison.experimental.unit)}</span>
        </div>
        <div className="grid grid-cols-[3rem_1fr_3.25rem] items-center gap-2 text-[11px]">
          <span className="font-medium text-slate-600">Ctrl</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-slate-400" style={{ width: `${ctrlWidth}%` }} />
          </div>
          <span className="text-right text-gray-700">{formatValue(comparison.control.value, comparison.control.unit)}</span>
        </div>
      </div>
    </div>
  );
}

function HazardRatioGauge({ value, raw }: { value: number; raw: string }) {
  const marker = clamp(((value - 0.2) / 1.6) * 100, 0, 100);
  const favorable = value < 1;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-800">Hazard ratio</p>
          <p className={`mt-0.5 text-[11px] font-medium ${favorable ? 'text-emerald-700' : 'text-amber-700'}`}>
            {favorable ? 'Favors experimental' : value === 1 ? 'Neutral' : 'Favors control'}
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          HR {raw}
        </span>
      </div>

      <div className="mt-5">
        <div className="relative h-2 rounded-full bg-gradient-to-r from-emerald-500 via-gray-200 to-amber-500">
          <div
            className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-900 shadow-sm"
            style={{ left: `${marker}%` }}
          />
          <div className="absolute left-1/2 top-1/2 h-4 w-px -translate-y-1/2 bg-gray-500/60" />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>0.2</span>
          <span>1.0</span>
          <span>1.8+</span>
        </div>
      </div>
    </div>
  );
}

function SingleResultTile({ result }: { result: SingleResult }) {
  const width = result.value.unit === '%' ? clamp(result.value.value, 4, 100) : clamp((result.value.value / 24) * 100, 4, 100);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-800">{result.label}</p>
          <p className={`mt-0.5 text-lg font-semibold ${result.higherIsBetter ? 'text-teal-700' : 'text-red-700'}`}>
            {formatValue(result.value.value, result.value.unit)}
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          Single arm
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${result.higherIsBetter ? 'bg-teal-500' : 'bg-red-500'}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function TrialResultsViz({ data, compact = false }: TrialResultsVizProps) {
  const comparisons = [
    getMedianComparison(data),
    getOrrComparison(data),
    getRateComparison('Grade 3+ adverse events', data.grade3PlusRate, false),
    getRateComparison('Discontinuation', data.discontinuationRate, false),
  ].filter(Boolean) as ResultComparison[];
  const singleResults = [
    getSingleMedianResult(data),
    getSingleOrrResult(data),
    getSingleRateResult('Grade 3+ adverse events', data.grade3PlusRate, false),
    getSingleRateResult('Discontinuation', data.discontinuationRate, false),
  ].filter(Boolean) as SingleResult[];
  const hazardRatio = parseHazardRatio(data.hazardRatio);
  const completeness = trialCompleteness(data);

  if (comparisons.length === 0 && singleResults.length === 0 && !hazardRatio) return null;

  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Results Visuals</h4>
          <p className="text-xs text-gray-500">
            {data.trialName ? data.trialName : 'Trial'}{data.phase ? `, phase ${data.phase}` : ''}
          </p>
        </div>
        <div className="min-w-28">
          <div className="flex items-center justify-between text-[10px] font-medium text-gray-500">
            <span>Core fields</span>
            <span>{completeness}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-cyan-600" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {hazardRatio && <HazardRatioGauge value={hazardRatio.value} raw={hazardRatio.raw} />}
        {comparisons.map(comparison => (
          <ComparisonBars key={comparison.label} comparison={comparison} />
        ))}
        {singleResults.map(result => (
          <SingleResultTile key={result.label} result={result} />
        ))}
      </div>
    </div>
  );
}
