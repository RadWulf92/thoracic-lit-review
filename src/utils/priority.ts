import type { Paper, PaperTracking } from '../types/paper';
import { PRIORITY_LABELS, type PaperPriority } from '../types/paper';
import { classifyPaper } from './paperClassifier';

export type ImpactLevel = 'high' | 'medium' | 'low';

export interface PaperImpactProfile {
  score: number;
  level: ImpactLevel;
  reasons: string[];
  isUnread: boolean;
  needsTakeaway: boolean;
  hasTrialData: boolean;
}

const HIGH_IMPACT_JOURNALS = new Set([
  'N Engl J Med',
  'Lancet',
  'Lancet Oncol',
  'J Clin Oncol',
  'Ann Oncol',
  'JAMA',
  'JAMA Oncol',
  'Nat Med',
  'Nat Rev Clin Oncol',
  'Cancer Discov',
  'Cancer Cell',
  'J Thorac Oncol',
]);

const PRACTICE_SIGNAL_PATTERNS = [
  /\bphase\s*(iii|3)\b/i,
  /\brandomi[sz]ed\b/i,
  /\boverall survival\b/i,
  /\bprogression-free survival\b/i,
  /\bhazard ratio\b/i,
  /\bnon[- ]inferiority\b/i,
  /\bsuperiority\b/i,
  /\bguideline\b/i,
  /\bconsensus\b/i,
  /\bpractice changing\b/i,
];

const BIOMARKER_SIGNAL_PATTERNS = [
  /\begfr\b/i,
  /\balk\b/i,
  /\bros1\b/i,
  /\bret\b/i,
  /\bmet\b/i,
  /\bher2\b/i,
  /\bkras\b/i,
  /\bntrk\b/i,
  /\bpd[- ]?l1\b/i,
  /\bmolecular\b/i,
  /\bbiomarker\b/i,
];

const ACUTE_SIGNAL_PATTERNS = [
  /\btoxicit/i,
  /\bemergenc/i,
  /\bneutropeni/i,
  /\bsepsis\b/i,
  /\bspinal cord compression\b/i,
  /\bsuperior vena cava\b/i,
  /\bhypercalcemia\b/i,
  /\bimmune[- ]related adverse/i,
  /\bpneumonitis\b/i,
];

function daysSince(dateString: string): number | null {
  const time = new Date(dateString).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((Date.now() - time) / 86_400_000);
}

function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(text));
}

function addReason(reasons: string[], reason: string) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

export function hasRecordedTrialData(tracking: PaperTracking | undefined): boolean {
  const trialData = tracking?.trialData;
  if (!trialData) return false;
  return Object.entries(trialData).some(
    ([key, value]) => key !== 'trialDataUpdatedAt' && value && String(value).trim()
  );
}

export function getPaperImpactProfile(
  paper: Paper,
  tracking: PaperTracking | undefined
): PaperImpactProfile {
  const reasons: string[] = [];
  let score = 0;

  const isUnread = !(tracking?.isRead ?? false);
  const category = classifyPaper(paper.pubTypes);
  const text = `${paper.title} ${paper.abstract} ${paper.pubTypes.join(' ')}`;
  const trialData = hasRecordedTrialData(tracking);
  const needsTakeaway = !tracking?.takeaway?.trim();

  const explicitPriority = tracking?.priority;
  if (explicitPriority) {
    const priorityScores: Record<PaperPriority, number> = {
      'must-read': 48,
      important: 34,
      later: 8,
      reference: -12,
    };
    score += priorityScores[explicitPriority];
    addReason(reasons, PRIORITY_LABELS[explicitPriority]);
  }

  switch (tracking?.relevance) {
    case 'practice-changing':
      score += 34;
      addReason(reasons, 'Practice changing');
      break;
    case 'clinically-relevant':
      score += 24;
      addReason(reasons, 'Clinically relevant');
      break;
    case 'hypothesis-generating':
      score += 12;
      addReason(reasons, 'Hypothesis generating');
      break;
    case 'background':
      score -= 6;
      break;
  }

  const rating = tracking?.rating ?? 0;
  if (rating >= 5) {
    score += 22;
    addReason(reasons, '5 star');
  } else if (rating === 4) {
    score += 17;
    addReason(reasons, '4 star');
  } else if (rating === 3) {
    score += 9;
  }

  switch (category) {
    case 'Guideline':
      score += 28;
      addReason(reasons, 'Guideline');
      break;
    case 'Clinical Trial':
      score += 22;
      addReason(reasons, 'Clinical trial');
      break;
    case 'Meta-Analysis':
      score += 20;
      addReason(reasons, 'Meta-analysis');
      break;
    case 'Review':
      score += 12;
      addReason(reasons, 'Review');
      break;
    case 'Original Research':
      score += 8;
      break;
    case 'Editorial':
      score -= 6;
      break;
  }

  if (HIGH_IMPACT_JOURNALS.has(paper.journalAbbrev)) {
    score += paper.journalAbbrev === 'J Thorac Oncol' ? 10 : 14;
    addReason(reasons, 'Major journal');
  }

  if (hasAnyPattern(text, PRACTICE_SIGNAL_PATTERNS)) {
    score += 16;
    addReason(reasons, 'Trial/guideline signal');
  }

  if (hasAnyPattern(text, BIOMARKER_SIGNAL_PATTERNS)) {
    score += 8;
    addReason(reasons, 'Biomarker');
  }

  if (hasAnyPattern(text, ACUTE_SIGNAL_PATTERNS)) {
    score += 8;
    addReason(reasons, 'Acute care');
  }

  const ageDays = daysSince(paper.epubDate ?? paper.pubDate);
  if (ageDays != null) {
    if (ageDays <= 14) {
      score += 8;
      addReason(reasons, 'New');
    } else if (ageDays <= 30) {
      score += 4;
    }
  }

  if (isUnread) {
    score += 8;
    addReason(reasons, 'Unread');
  } else {
    score -= 4;
  }

  if (trialData) {
    score += 6;
    addReason(reasons, 'Trial data saved');
  }

  if (needsTakeaway && score >= 35) {
    score += 5;
    addReason(reasons, 'Needs takeaway');
  }

  const level: ImpactLevel = score >= 60 ? 'high' : score >= 38 ? 'medium' : 'low';

  return {
    score,
    level,
    reasons: reasons.slice(0, 5),
    isUnread,
    needsTakeaway,
    hasTrialData: trialData,
  };
}

export function compareByImpact(
  a: Paper,
  b: Paper,
  tracking: Record<string, PaperTracking>
): number {
  const impactDiff =
    getPaperImpactProfile(b, tracking[b.pmid]).score -
    getPaperImpactProfile(a, tracking[a.pmid]).score;

  if (impactDiff !== 0) return impactDiff;
  return b.pubDate.localeCompare(a.pubDate);
}
