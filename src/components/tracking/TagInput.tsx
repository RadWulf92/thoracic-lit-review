import { useState, useRef, useEffect } from 'react';
import { useTrackingStore } from '../../stores/trackingStore';

interface TagInputProps {
  pmid: string;
  tags: string[];
}

export function TagInput({ pmid, tags }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addTag = useTrackingStore(s => s.addTag);
  const removeTag = useTrackingStore(s => s.removeTag);
  const getAllTags = useTrackingStore(s => s.getAllTags);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allTags = getAllTags();
  const suggestions = inputValue.trim()
    ? allTags.filter(t => t.includes(inputValue.trim().toLowerCase()) && !tags.includes(t))
    : allTags.filter(t => !tags.includes(t));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAdd = (tag: string) => {
    addTag(pmid, tag);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAdd(inputValue.trim());
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(pmid, tags[tags.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1 min-h-[28px]">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(pmid, tag)}
              className="text-cyan-400 hover:text-cyan-600 ml-0.5"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
          className="flex-1 min-w-[80px] text-xs bg-transparent outline-none placeholder-gray-400 py-0.5"
        />
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 max-h-32 overflow-y-auto">
          {suggestions.slice(0, 8).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAdd(tag)}
              className="w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Compact inline display of tags (for collapsed card view) */
export function TagsDisplay({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center px-1.5 py-0 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full text-[10px] leading-4"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
