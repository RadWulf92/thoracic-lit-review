import { useState } from 'react';
import { searchPubMed } from '../../services/pubmedApi';
import { useReadingListStore } from '../../stores/readingListStore';
import type { Paper } from '../../types/paper';
import { format, parseISO } from 'date-fns';

function formatAuthors(authors: Paper['authors']): string {
  if (authors.length === 0) return 'Unknown authors';
  if (authors.length <= 3) {
    return authors.map(a => `${a.lastName} ${a.initials}`).join(', ');
  }
  return `${authors[0].lastName} ${authors[0].initials} et al.`;
}

export function ArticleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const pmids = useReadingListStore(s => s.pmids);
  const addToReadingList = useReadingListStore(s => s.addToReadingList);
  const removeFromReadingList = useReadingListStore(s => s.removeFromReadingList);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const papers = await searchPubMed(query);
      setResults(papers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Search PubMed</h2>
        <p className="text-sm text-gray-500 mb-4">
          Search any article on PubMed by title, author, keyword, PMID, or DOI.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "EGFR resistance osimertinib" or PMID: 38123456'
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-400"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-5 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isSearching ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isSearching && (
        <div className="flex items-center justify-center py-12 text-sm text-gray-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent mr-3" />
          Searching PubMed...
        </div>
      )}

      {!isSearching && hasSearched && results.length === 0 && !error && (
        <div className="text-center py-12 text-sm text-gray-500">
          No results found. Try different search terms.
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-3">{results.length} results</p>
          <div className="space-y-3">
            {results.map(paper => {
              const isAdded = pmids.includes(paper.pmid);
              const pubDate = paper.pubDate ? format(parseISO(paper.pubDate), 'MMM d, yyyy') : '';

              return (
                <article
                  key={paper.pmid}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                          {paper.journalAbbrev}
                        </span>
                        <span className="text-xs text-gray-400">{pubDate}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">
                        {paper.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{formatAuthors(paper.authors)}</p>
                      {paper.abstract && (
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                          {paper.abstract}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>PMID: {paper.pmid}</span>
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-800 hover:underline"
                          >
                            Full text
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => isAdded ? removeFromReadingList(paper.pmid) : addToReadingList(paper.pmid)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isAdded
                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                          : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
                      }`}
                      title={isAdded ? 'Remove from reading list' : 'Add to reading list'}
                    >
                      {isAdded ? (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Added
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
