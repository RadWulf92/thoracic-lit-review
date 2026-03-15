import type { Paper, AbstractSection, Author } from '../types/paper';

function getText(el: Element | null, selector: string): string {
  return el?.querySelector(selector)?.textContent?.trim() ?? '';
}

function getAllText(el: Element | null, selector: string): string[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll(selector)).map(e => e.textContent?.trim() ?? '');
}

function parseAuthors(articleEl: Element | null): Author[] {
  if (!articleEl) return [];
  const authorEls = articleEl.querySelectorAll('AuthorList Author');
  return Array.from(authorEls).map(a => ({
    lastName: getText(a, 'LastName'),
    foreName: getText(a, 'ForeName'),
    initials: getText(a, 'Initials'),
    affiliation: a.querySelector('AffiliationInfo Affiliation')?.textContent?.trim(),
  })).filter(a => a.lastName);
}

function parseAbstract(articleEl: Element | null): { abstract: string; sections: AbstractSection[] } {
  if (!articleEl) return { abstract: '', sections: [] };

  const abstractTexts = articleEl.querySelectorAll('Abstract AbstractText');
  if (abstractTexts.length === 0) return { abstract: '', sections: [] };

  const sections: AbstractSection[] = Array.from(abstractTexts).map(el => ({
    label: el.getAttribute('Label') ?? '',
    text: el.textContent?.trim() ?? '',
  }));

  const abstract = sections
    .map(s => s.label ? `${s.label}: ${s.text}` : s.text)
    .join('\n\n');

  return { abstract, sections };
}

function parsePubDate(articleEl: Element | null): string {
  if (!articleEl) return '';

  // Try ArticleDate first (electronic pub date)
  const articleDate = articleEl.querySelector('ArticleDate');
  if (articleDate) {
    const y = getText(articleDate, 'Year');
    const m = getText(articleDate, 'Month').padStart(2, '0');
    const d = getText(articleDate, 'Day').padStart(2, '0');
    if (y) return `${y}-${m || '01'}-${d || '01'}`;
  }

  // Fall back to PubDate in Journal > JournalIssue
  const pubDate = articleEl.querySelector('Journal JournalIssue PubDate');
  if (pubDate) {
    const y = getText(pubDate, 'Year');
    const m = getText(pubDate, 'Month');
    const d = getText(pubDate, 'Day');
    const monthNum = monthToNum(m);
    if (y) return `${y}-${monthNum}-${d ? d.padStart(2, '0') : '01'}`;
  }

  return '';
}

function monthToNum(m: string): string {
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  if (/^\d+$/.test(m)) return m.padStart(2, '0');
  return months[m] ?? '01';
}

function parseDoi(article: Element): string | undefined {
  const idList = article.querySelector('PubmedData ArticleIdList');
  if (!idList) return undefined;
  const ids = idList.querySelectorAll('ArticleId');
  for (const id of ids) {
    if (id.getAttribute('IdType') === 'doi') {
      return id.textContent?.trim();
    }
  }
  return undefined;
}

function parsePmcid(article: Element): string | undefined {
  const idList = article.querySelector('PubmedData ArticleIdList');
  if (!idList) return undefined;
  const ids = idList.querySelectorAll('ArticleId');
  for (const id of ids) {
    if (id.getAttribute('IdType') === 'pmc') {
      return id.textContent?.trim();
    }
  }
  return undefined;
}

export function parsePubMedXml(xmlString: string): Paper[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.error('XML parse error:', parseError.textContent);
    return [];
  }

  const articles = doc.querySelectorAll('PubmedArticle');

  return Array.from(articles).map(article => {
    const medlineCitation = article.querySelector('MedlineCitation');
    const articleEl = medlineCitation?.querySelector('Article') ?? null;

    const pmid = getText(medlineCitation, 'PMID');
    const title = getText(articleEl, 'ArticleTitle');
    const { abstract, sections } = parseAbstract(articleEl);
    const authors = parseAuthors(articleEl);
    const journal = getText(articleEl, 'Journal Title');
    const journalAbbrev = getText(articleEl, 'Journal ISOAbbreviation');
    const pubDate = parsePubDate(articleEl);
    const volume = getText(articleEl, 'Journal JournalIssue Volume');
    const issue = getText(articleEl, 'Journal JournalIssue Issue');
    const pages = getText(articleEl, 'Pagination MedlinePgn');

    const pubTypeEls = articleEl?.querySelectorAll('PublicationTypeList PublicationType');
    const pubTypes = Array.from(pubTypeEls ?? []).map(e => e.textContent?.trim() ?? '');

    const meshEls = medlineCitation?.querySelectorAll('MeshHeadingList MeshHeading DescriptorName');
    const keywords = [
      ...getAllText(medlineCitation, 'KeywordList Keyword'),
      ...Array.from(meshEls ?? []).map(e => e.textContent?.trim() ?? ''),
    ];

    const pubStatusText = article.querySelector('PubmedData PublicationStatus')?.textContent?.trim();
    const pubStatus = (pubStatusText === 'aheadofprint' || pubStatusText === 'epublish' || pubStatusText === 'ppublish')
      ? pubStatusText as 'aheadofprint' | 'epublish' | 'ppublish'
      : undefined;

    return {
      pmid,
      title,
      abstract,
      abstractSections: sections,
      authors,
      journal,
      journalAbbrev,
      pubDate,
      doi: parseDoi(article),
      pmcid: parsePmcid(article),
      volume,
      issue,
      pages,
      pubTypes,
      keywords: [...new Set(keywords)],
      pubStatus,
      fetchedAt: new Date().toISOString(),
    };
  }).filter(p => p.pmid);
}
