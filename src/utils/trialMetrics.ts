import type { TrialData } from '../types/paper';

export interface ParsedValue {
  value: number;
  raw: string;
  unit: '%' | 'mo' | '';
}

export interface ResultComparison {
  label: string;
  experimental: ParsedValue;
  control: ParsedValue;
  higherIsBetter: boolean;
}

export interface SingleResult {
  label: string;
  value: ParsedValue;
  higherIsBetter: boolean;
}

export interface HazardRatioMetric {
  value: number;
  raw: string;
}

function clean(value: string | undefined): string | undefined {
  return value?.replace(/\s+/g, ' ').trim();
}

export function parseNumericValue(value: string | undefined): ParsedValue | undefined {
  const text = clean(value);
  if (!text) return undefined;

  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;

  const numeric = Number(match[0]);
  if (!Number.isFinite(numeric)) return undefined;

  const lower = text.toLowerCase();
  const unit = text.includes('%') ? '%' : /\b(?:mo|month|months)\b/.test(lower) ? 'mo' : '';
  return { value: numeric, raw: text, unit };
}

export function parsePairedValues(value: string | undefined): [ParsedValue, ParsedValue] | undefined {
  const text = clean(value);
  if (!text) return undefined;

  const matches = Array.from(text.matchAll(/-?\d+(?:\.\d+)?\s*%?/g)).map(match => match[0]);
  if (matches.length < 2) return undefined;

  const unit: ParsedValue['unit'] = text.includes('%')
    ? '%'
    : /\b(?:mo|month|months)\b/i.test(text)
      ? 'mo'
      : '';

  const first = Number(matches[0].replace('%', ''));
  const second = Number(matches[1].replace('%', ''));
  if (!Number.isFinite(first) || !Number.isFinite(second)) return undefined;

  return [
    { value: first, raw: matches[0], unit },
    { value: second, raw: matches[1], unit },
  ];
}

export function parseHazardRatio(value: string | undefined): HazardRatioMetric | undefined {
  const parsed = parseNumericValue(value);
  if (!parsed || parsed.value <= 0) return undefined;
  return { value: parsed.value, raw: clean(value) ?? String(parsed.value) };
}

export function getMedianComparison(data: TrialData): ResultComparison | undefined {
  const experimental = parseNumericValue(data.medianExpArm);
  const control = parseNumericValue(data.medianCtrlArm);
  if (!experimental || !control) return undefined;

  return {
    label: data.primaryEndpoint ? `Median ${data.primaryEndpoint}` : 'Median outcome',
    experimental,
    control,
    higherIsBetter: true,
  };
}

export function getSingleMedianResult(data: TrialData): SingleResult | undefined {
  const value = parseNumericValue(data.medianExpArm);
  if (!value || parseNumericValue(data.medianCtrlArm)) return undefined;

  return {
    label: data.primaryEndpoint && !/safety|toxicity|adverse/i.test(data.primaryEndpoint)
      ? `Median ${data.primaryEndpoint}`
      : 'Median outcome',
    value,
    higherIsBetter: true,
  };
}

export function getOrrComparison(data: TrialData): ResultComparison | undefined {
  const experimental = parseNumericValue(data.orrExpArm);
  const control = parseNumericValue(data.orrCtrlArm);
  if (!experimental || !control) return undefined;

  return {
    label: 'Objective response',
    experimental,
    control,
    higherIsBetter: true,
  };
}

export function getSingleOrrResult(data: TrialData): SingleResult | undefined {
  const value = parseNumericValue(data.orrExpArm);
  if (!value || parseNumericValue(data.orrCtrlArm)) return undefined;

  return {
    label: 'Objective response',
    value,
    higherIsBetter: true,
  };
}

export function getRateComparison(
  label: string,
  value: string | undefined,
  higherIsBetter: boolean
): ResultComparison | undefined {
  const pair = parsePairedValues(value);
  if (!pair) return undefined;

  return {
    label,
    experimental: pair[0],
    control: pair[1],
    higherIsBetter,
  };
}

export function getSingleRateResult(
  label: string,
  value: string | undefined,
  higherIsBetter: boolean
): SingleResult | undefined {
  if (parsePairedValues(value)) return undefined;
  const parsed = parseNumericValue(value);
  if (!parsed) return undefined;

  return {
    label,
    value: parsed,
    higherIsBetter,
  };
}

export function hasVisualizableTrialResults(data: TrialData | undefined): boolean {
  if (!data) return false;
  return Boolean(
    getMedianComparison(data) ||
    getOrrComparison(data) ||
    getRateComparison('Grade 3+ adverse events', data.grade3PlusRate, false) ||
    getRateComparison('Discontinuation', data.discontinuationRate, false) ||
    getSingleMedianResult(data) ||
    getSingleOrrResult(data) ||
    getSingleRateResult('Grade 3+ adverse events', data.grade3PlusRate, false) ||
    getSingleRateResult('Discontinuation', data.discontinuationRate, false) ||
    parseHazardRatio(data.hazardRatio)
  );
}

export function trialCompleteness(data: TrialData | undefined): number {
  if (!data) return 0;
  const coreFields: Array<keyof TrialData> = [
    'trialName',
    'phase',
    'nPatients',
    'experimentalArm',
    'controlArm',
    'primaryEndpoint',
    'hazardRatio',
    'medianExpArm',
    'medianCtrlArm',
  ];

  const filled = coreFields.filter(field => data[field] && String(data[field]).trim()).length;
  return Math.round((filled / coreFields.length) * 100);
}
