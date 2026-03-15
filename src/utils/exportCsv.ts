import type { Paper, PaperTracking } from '../types/paper';
import { RELEVANCE_LABELS } from '../types/paper';
import { classifyPaper } from './paperClassifier';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportPapersAsCsv(
  papers: Paper[],
  tracking: Record<string, PaperTracking>
): void {
  const headers = [
    'PMID', 'Title', 'Authors', 'Journal', 'Date', 'Type', 'Status', 'DOI',
    'Read', 'Rating', 'Clinical Relevance', 'Key Takeaway', 'Tags', 'Notes',
  ];

  const rows = papers.map(p => {
    const t = tracking[p.pmid];
    const authors = p.authors.map(a => `${a.lastName} ${a.initials}`).join('; ');
    const category = classifyPaper(p.pubTypes);
    const relevance = t?.relevance ? RELEVANCE_LABELS[t.relevance] : '';
    const tags = (t?.tags ?? []).join('; ');

    return [
      p.pmid,
      escapeCsv(p.title),
      escapeCsv(authors),
      escapeCsv(p.journalAbbrev),
      p.pubDate,
      category,
      p.pubStatus === 'aheadofprint' ? 'Ahead of Print' : 'Published',
      p.doi ?? '',
      t?.isRead ? 'Yes' : 'No',
      String(t?.rating ?? 0),
      relevance,
      escapeCsv(t?.takeaway ?? ''),
      escapeCsv(tags),
      escapeCsv(t?.notes ?? ''),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `thoracic-oncology-papers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
