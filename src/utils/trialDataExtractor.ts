import type { Paper, TrialData } from '../types/paper';

type TrialDataField = keyof TrialData;

export interface TrialExtractionResult {
  data: TrialData;
  fields: TrialDataField[];
}

export const TRIAL_FIELD_LABELS: Partial<Record<TrialDataField, string>> = {
  trialName: 'Trial name',
  phase: 'Phase',
  design: 'Design',
  nPatients: 'N patients',
  setting: 'Setting',
  histology: 'Histology',
  biomarkerSelection: 'Biomarker',
  stage: 'Stage',
  experimentalArm: 'Experimental arm',
  controlArm: 'Control arm',
  primaryEndpoint: 'Primary endpoint',
  medianExpArm: 'Median experimental',
  medianCtrlArm: 'Median control',
  hazardRatio: 'Hazard ratio',
  pValue: 'p-value',
  orrExpArm: 'ORR experimental',
  orrCtrlArm: 'ORR control',
  secondaryResults: 'Other key results',
  grade3PlusRate: 'Grade 3+ AE rate',
  keyToxicities: 'Key toxicities',
  discontinuationRate: 'Discontinuation rate',
};

const KNOWN_TRIAL_PREFIXES = [
  'ADAURA',
  'AEGEAN',
  'ALEX',
  'ALINA',
  'CROWN',
  'CheckMate',
  'CodeBreaK',
  'DESTINY',
  'FLAURA',
  'IMpower',
  'KEYNOTE',
  'LAURA',
  'LIBRETTO',
  'MARIPOSA',
  'PACIFIC',
  'POSEIDON',
  'TROPION',
];

function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[,;:\s]+|[,;:\s]+$/g, '')
    .trim();
}

function firstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = clean(match?.[1]);
    if (value) return value;
  }
  return undefined;
}

function sentenceContaining(text: string, patterns: RegExp[]): string | undefined {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);

  return sentences.find(sentence => patterns.some(pattern => pattern.test(sentence)));
}

function normalizePhase(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .replace(/\bphase\b/i, '')
    .replace(/\s+/g, '')
    .replace(/1/gi, 'I')
    .replace(/2/gi, 'II')
    .replace(/3/gi, 'III')
    .replace(/4/gi, 'IV')
    .replace(/B/g, 'b')
    .replace(/A/g, 'a');
}

function extractTrialName(text: string): string | undefined {
  for (const prefix of KNOWN_TRIAL_PREFIXES) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp(`\\b(${escaped}[-\\s]?[A-Z0-9]+)\\b`, 'i'));
    if (match?.[1]) return clean(match[1].replace(/\s+/g, '-'));
  }

  const allCaps = Array.from(text.matchAll(/\b([A-Z]{2,}[A-Z0-9]*(?:-[A-Z0-9]{2,})+)\b/g))
    .map(match => match[1])
    .filter(name => !/^(?:PD-L1|NSCLC|SCLC|EGFR|ALK|ROS1|NTRK|HER2)$/i.test(name));

  return clean(allCaps[0]);
}

function extractDesign(text: string): string | undefined {
  const descriptors: string[] = [];
  if (/randomi[sz]ed/i.test(text)) descriptors.push('Randomized');
  if (/double[-\s]blind/i.test(text)) descriptors.push('Double-blind');
  if (/open[-\s]label/i.test(text)) descriptors.push('Open-label');
  if (/single[-\s]arm/i.test(text)) descriptors.push('Single-arm');
  if (/multicente?r/i.test(text)) descriptors.push('Multicenter');
  return descriptors.length > 0 ? descriptors.join(', ') : undefined;
}

function extractHistology(text: string): string | undefined {
  if (/\bnon[-\s]small cell lung cancer\b|\bNSCLC\b/i.test(text)) return 'NSCLC';
  if (/\bsmall cell lung cancer\b|\bSCLC\b/i.test(text)) return 'SCLC';
  if (/\bmesothelioma\b/i.test(text)) return 'Mesothelioma';
  if (/\bthymic\b/i.test(text)) return 'Thymic malignancy';
  if (/\blung cancer\b/i.test(text)) return 'Lung cancer';
  return undefined;
}

function extractStage(text: string): string | undefined {
  return firstMatch(text, [
    /\b(stage\s+(?:I{1,3}|IV|1|2|3|4)[A-Ca-c]?)\b/i,
    /\b((?:locally advanced|advanced|metastatic|unresectable)(?:[^.;]{0,60})?)\s+(?:non[-\s]small|small cell|lung|cancer|NSCLC|SCLC)/i,
  ]);
}

function extractBiomarker(text: string): string | undefined {
  const markerSentence = sentenceContaining(text, [
    /\bEGFR\b/i,
    /\bALK\b/i,
    /\bROS1\b/i,
    /\bRET\b/i,
    /\bMET\b/i,
    /\bHER2\b/i,
    /\bKRAS\b/i,
    /\bNTRK\b/i,
    /\bPD[-\s]?L1\b/i,
  ]);

  if (!markerSentence) return undefined;
  return clean(
    markerSentence.match(/(?:with|harboring|selected for|positive for)\s+([^.;]{0,100}?(?:EGFR|ALK|ROS1|RET|MET|HER2|KRAS|NTRK|PD[-\s]?L1)[^.;]{0,80})/i)?.[1] ??
    markerSentence.match(/((?:EGFR|ALK|ROS1|RET|MET|HER2|KRAS|NTRK|PD[-\s]?L1)[^.;]{0,90})/i)?.[1]
  );
}

function extractArms(text: string): Pick<TrialData, 'experimentalArm' | 'controlArm'> {
  const received = text.match(/(?:received|assigned to receive)\s+([^.;]{3,120}?)\s+(?:versus|vs\.?|compared with)\s+([^.;]{3,120})/i);
  if (received) {
    return {
      experimentalArm: clean(received[1]),
      controlArm: clean(received[2]),
    };
  }

  const plusVersus = text.match(/\b([^.;]{3,100}?\b(?:plus|with)\b[^.;]{3,100}?)\s+(?:versus|vs\.?)\s+([^.;]{3,120})/i);
  if (plusVersus) {
    return {
      experimentalArm: clean(plusVersus[1]),
      controlArm: clean(plusVersus[2]),
    };
  }

  return {};
}

function extractEndpoint(text: string): string | undefined {
  const endpoint = firstMatch(text, [
    /primary (?:end point|endpoint)s?\s+(?:was|were|included|:)\s+([^.;]+)/i,
    /primary (?:end point|endpoint)s?\s+([^.;]+)/i,
  ]);
  if (endpoint) return endpoint;

  if (/\bprogression[-\s]free survival\b|\bPFS\b/i.test(text)) return 'PFS';
  if (/\boverall survival\b|\bOS\b/i.test(text)) return 'OS';
  if (/\bobjective response rate\b|\bORR\b/i.test(text)) return 'ORR';
  return undefined;
}

function extractMedianResults(text: string): Pick<TrialData, 'medianExpArm' | 'medianCtrlArm'> {
  const match = text.match(/median\s+(?:progression[-\s]free survival|overall survival|PFS|OS)[^.;]*?(\d+(?:\.\d+)?\s*(?:months?|mo))\s+(?:vs\.?|versus)\s+(\d+(?:\.\d+)?\s*(?:months?|mo))/i);
  if (match) {
    return {
      medianExpArm: clean(match[1]),
      medianCtrlArm: clean(match[2]),
    };
  }

  const singleArm = text.match(/median\s+(?:progression[-\s]free survival|overall survival|PFS|OS)[^.;]*?(?:was|of)?\s*(\d+(?:\.\d+)?\s*(?:months?|mo))/i);
  return singleArm ? { medianExpArm: clean(singleArm[1]) } : {};
}

function extractOrr(text: string): Pick<TrialData, 'orrExpArm' | 'orrCtrlArm'> {
  const match = text.match(/(?:objective response rate|ORR)[^.;]*?(\d+(?:\.\d+)?%)\s+(?:vs\.?|versus)\s+(\d+(?:\.\d+)?%)/i);
  if (match) {
    return {
      orrExpArm: clean(match[1]),
      orrCtrlArm: clean(match[2]),
    };
  }

  const singleArm = text.match(/(?:objective response rate|ORR)[^.;]*?(?:was|of)?\s*(\d+(?:\.\d+)?%)/i);
  return singleArm ? { orrExpArm: clean(singleArm[1]) } : {};
}

function extractRate(text: string, label: RegExp): string | undefined {
  const sentence = sentenceContaining(text, [label]);
  const value = sentence?.match(/(\d+(?:\.\d+)?%\s*(?:vs\.?|versus)?\s*\d*(?:\.\d+)?%?)/i)?.[1];
  return clean(value);
}

function setIfPresent(data: TrialData, field: TrialDataField, value: string | undefined) {
  if (value) {
    (data as Record<TrialDataField, string | undefined>)[field] = value;
  }
}

export function extractTrialDataFromPaper(paper: Paper): TrialExtractionResult {
  const text = clean(`${paper.title}. ${paper.abstract}`) ?? '';
  const data: TrialData = {};

  setIfPresent(data, 'trialName', extractTrialName(text));
  setIfPresent(data, 'phase', normalizePhase(firstMatch(text, [/\bphase\s+(I\/II|II\/III|[IVX]+[ab]?|[1-4][ab]?)\b/i])));
  setIfPresent(data, 'design', extractDesign(text));
  setIfPresent(data, 'nPatients', firstMatch(text, [
    /\b(?:a\s+total\s+of|total\s+of)\s+(\d{2,5})\s+(?:patients|participants)\b/i,
    /\b(?:enrolled|included|randomly assigned)\s+(\d{2,5})\s+(?:patients|participants)\b/i,
    /\b(\d{2,5})\s+(?:patients|participants)\s+(?:were\s+)?(?:enrolled|included|randomly assigned)\b/i,
    /\b(?:n|N)\s*=\s*(\d{2,5})\b/,
  ]));
  setIfPresent(data, 'setting', firstMatch(text, [
    /\b(first[-\s]line|second[-\s]line|previously untreated|previously treated|post[-\s]platinum|maintenance)\b/i,
  ]));
  setIfPresent(data, 'histology', extractHistology(text));
  setIfPresent(data, 'stage', extractStage(text));
  setIfPresent(data, 'biomarkerSelection', extractBiomarker(text));

  Object.assign(data, extractArms(text));
  setIfPresent(data, 'primaryEndpoint', extractEndpoint(text));
  Object.assign(data, extractMedianResults(text));
  setIfPresent(data, 'hazardRatio', firstMatch(text, [
    /\bhazard ratio\s*(?:\(?HR\)?\s*)?(?:=|of|was)?\s*([0-9.]+(?:\s*\([^)]+\))?)/i,
    /\bHR\s*[=:]?\s*([0-9.]+(?:\s*\([^)]+\))?)/i,
  ]));
  setIfPresent(data, 'pValue', firstMatch(text, [/\bp\s*([<=>]\s*0\.\d+)/i]));
  Object.assign(data, extractOrr(text));
  setIfPresent(data, 'grade3PlusRate', extractRate(text, /\b(?:grade\s*(?:3|>=3|3 or higher)|grade\s*3[-\s]or[-\s]higher)\b/i));
  setIfPresent(data, 'discontinuationRate', extractRate(text, /\bdiscontinu/i));

  const toxicitySentence = sentenceContaining(text, [/\badverse events?\b/i, /\btoxicities\b/i, /\bsafety\b/i]);
  setIfPresent(data, 'keyToxicities', toxicitySentence ? clean(toxicitySentence.slice(0, 220)) : undefined);

  const secondarySentence = sentenceContaining(text, [/\boverall survival\b/i, /\bduration of response\b/i, /\bsecondary end points?\b/i]);
  setIfPresent(data, 'secondaryResults', secondarySentence ? clean(secondarySentence.slice(0, 220)) : undefined);

  const fields = Object.entries(data)
    .filter(([, value]) => value && String(value).trim())
    .map(([field]) => field as TrialDataField);

  return { data, fields };
}

export function mergeTrialDataBlanks(current: TrialData | undefined, extracted: TrialData): TrialExtractionResult {
  const merged: TrialData = { ...(current ?? {}) };
  const filled: TrialDataField[] = [];

  for (const [field, value] of Object.entries(extracted) as [TrialDataField, string | undefined][]) {
    if (!value || field === 'trialDataUpdatedAt') continue;
    const existing = merged[field];
    if (!existing || !String(existing).trim()) {
      (merged as Record<TrialDataField, string | undefined>)[field] = value;
      filled.push(field);
    }
  }

  return { data: merged, fields: filled };
}
