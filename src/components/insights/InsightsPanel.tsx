import { useMemo } from 'react';
import { usePaperStore } from '../../stores/paperStore';
import { useTrackingStore } from '../../stores/trackingStore';
import { classifyPaper } from '../../utils/paperClassifier';
import { getPaperImpactProfile, hasRecordedTrialData } from '../../utils/priority';
import { PRIORITY_LABELS, RELEVANCE_LABELS, type PaperPriority } from '../../types/paper';
import type { Paper } from '../../types/paper';

interface BarDatum {
  label: string;
  count: number;
  color: string;
}

const TOPIC_PATTERNS: Array<{ label: string; pattern: RegExp; color: string }> = [
  { label: 'EGFR', pattern: /\bEGFR\b/i, color: 'bg-teal-500' },
  { label: 'ALK/ROS1/RET', pattern: /\b(?:ALK|ROS1|RET)\b/i, color: 'bg-blue-500' },
  { label: 'KRAS/MET/HER2', pattern: /\b(?:KRAS|MET|HER2)\b/i, color: 'bg-violet-500' },
  { label: 'Immunotherapy', pattern: /\b(?:immunotherapy|pembrolizumab|nivolumab|atezolizumab|durvalumab|cemiplimab|PD-?1|PD-?L1|CTLA-?4)\b/i, color: 'bg-emerald-500' },
  { label: 'Radiotherapy', pattern: /\b(?:radiotherapy|radiation|SBRT|SABR|chemoradi)\b/i, color: 'bg-amber-500' },
  { label: 'Surgery', pattern: /\b(?:surgery|surgical|resection|lobectomy|neoadjuvant|adjuvant)\b/i, color: 'bg-indigo-500' },
  { label: 'Toxicity', pattern: /\b(?:toxicity|adverse event|pneumonitis|immune-related|irAE|neutropenia)\b/i, color: 'bg-red-500' },
  { label: 'SCLC', pattern: /\b(?:SCLC|small cell lung cancer)\b/i, color: 'bg-pink-500' },
];

function percent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function BarList({ title, data }: { title: string; data: BarDatum[] }) {
  const max = Math.max(1, ...data.map(item => item.count));

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <div className="mt-3 space-y-2">
        {data.length === 0 && (
          <p className="text-xs text-gray-500">No matching papers yet.</p>
        )}
        {data.map(item => (
          <div key={item.label} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-xs">
            <span className="truncate text-gray-600" title={item.label}>{item.label}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
              />
            </div>
            <span className="text-right font-medium text-gray-500">{item.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatTile({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function getPhaseBucket(paper: Paper): string {
  const text = `${paper.title} ${paper.abstract}`;
  const phase = text.match(/\bphase\s+(I\/II|II\/III|[IVX]+|[1-4])\b/i)?.[1]?.toUpperCase();
  if (!phase) return 'Unclear phase';
  if (phase === '1') return 'Phase I';
  if (phase === '2') return 'Phase II';
  if (phase === '3') return 'Phase III';
  if (phase === '4') return 'Phase IV';
  return `Phase ${phase}`;
}

export function InsightsPanel() {
  const papers = usePaperStore(s => s.papers);
  const tracking = useTrackingStore(s => s.tracking);

  const insights = useMemo(() => {
    const readCount = papers.filter(paper => tracking[paper.pmid]?.isRead).length;
    const takeaways = papers.filter(paper => tracking[paper.pmid]?.takeaway?.trim()).length;
    const readFirst = papers.filter(paper => getPaperImpactProfile(paper, tracking[paper.pmid]).level === 'high').length;
    const clinicalTrials = papers.filter(paper => classifyPaper(paper.pubTypes) === 'Clinical Trial');
    const trialsWithData = clinicalTrials.filter(paper => hasRecordedTrialData(tracking[paper.pmid])).length;

    const priorityCounts = new Map<PaperPriority | 'unmarked', number>([
      ['must-read', 0],
      ['important', 0],
      ['later', 0],
      ['reference', 0],
      ['unmarked', 0],
    ]);
    const relevanceCounts = new Map<string, number>();
    const journalCounts = new Map<string, number>();
    const phaseCounts = new Map<string, number>();
    const topicCounts = new Map<string, number>();

    for (const topic of TOPIC_PATTERNS) topicCounts.set(topic.label, 0);

    for (const paper of papers) {
      const t = tracking[paper.pmid];
      priorityCounts.set(t?.priority ?? 'unmarked', (priorityCounts.get(t?.priority ?? 'unmarked') ?? 0) + 1);
      if (t?.relevance) {
        const label = RELEVANCE_LABELS[t.relevance];
        relevanceCounts.set(label, (relevanceCounts.get(label) ?? 0) + 1);
      }
      journalCounts.set(paper.journalAbbrev, (journalCounts.get(paper.journalAbbrev) ?? 0) + 1);

      if (classifyPaper(paper.pubTypes) === 'Clinical Trial') {
        const phase = getPhaseBucket(paper);
        phaseCounts.set(phase, (phaseCounts.get(phase) ?? 0) + 1);
      }

      const text = `${paper.title} ${paper.abstract} ${paper.keywords.join(' ')}`;
      for (const topic of TOPIC_PATTERNS) {
        if (topic.pattern.test(text)) {
          topicCounts.set(topic.label, (topicCounts.get(topic.label) ?? 0) + 1);
        }
      }
    }

    return {
      readCount,
      readPercent: percent(readCount, papers.length),
      takeaways,
      takeawayPercent: percent(takeaways, papers.length),
      readFirst,
      clinicalTrials: clinicalTrials.length,
      trialsWithData,
      trialCapturePercent: percent(trialsWithData, clinicalTrials.length),
      priorityData: Array.from(priorityCounts.entries()).map(([key, count]) => ({
        label: key === 'unmarked' ? 'Unmarked' : PRIORITY_LABELS[key],
        count,
        color: key === 'must-read' ? 'bg-red-500' : key === 'important' ? 'bg-amber-500' : key === 'later' ? 'bg-sky-500' : key === 'reference' ? 'bg-gray-400' : 'bg-slate-300',
      })),
      relevanceData: Array.from(relevanceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count, color: 'bg-cyan-500' })),
      journalData: Array.from(journalCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, count]) => ({ label, count, color: 'bg-indigo-500' })),
      phaseData: Array.from(phaseCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count, color: label.includes('III') ? 'bg-red-500' : label.includes('II') ? 'bg-amber-500' : 'bg-emerald-500' })),
      topicData: Array.from(topicCounts.entries())
        .map(([label, count]) => ({ label, count, color: TOPIC_PATTERNS.find(t => t.label === label)?.color ?? 'bg-gray-400' }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count),
    };
  }, [papers, tracking]);

  if (papers.length === 0) {
    return <div className="text-sm text-gray-500">Fetch or load papers to see insights.</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Insights</h2>
        <p className="text-sm text-gray-500">{papers.length} papers in the current collection.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Reading" value={`${insights.readPercent}%`} detail={`${insights.readCount} of ${papers.length} read`} color="text-emerald-600" />
        <StatTile label="Read first" value={String(insights.readFirst)} detail="Trials, guidelines, or major journals" color="text-red-600" />
        <StatTile label="Trial capture" value={`${insights.trialCapturePercent}%`} detail={`${insights.trialsWithData} of ${insights.clinicalTrials} trials with data`} color="text-cyan-700" />
        <StatTile label="Takeaways" value={`${insights.takeawayPercent}%`} detail={`${insights.takeaways} papers summarized`} color="text-violet-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarList title="Priority Mix" data={insights.priorityData} />
        <BarList title="Top Topics" data={insights.topicData} />
        <BarList title="Trial Phases" data={insights.phaseData.length > 0 ? insights.phaseData : [{ label: 'No clinical trials', count: 0, color: 'bg-gray-300' }]} />
        <BarList title="Top Journals" data={insights.journalData} />
      </div>

      {insights.relevanceData.length > 0 && (
        <BarList title="Clinical Relevance Grading" data={insights.relevanceData} />
      )}
    </div>
  );
}
