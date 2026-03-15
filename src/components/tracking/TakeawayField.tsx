import { useState, useRef, useEffect } from 'react';

interface TakeawayFieldProps {
  value: string;
  onSave: (value: string) => void;
}

export function TakeawayField({ value, onSave }: TakeawayFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(draft.trim());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder="Key takeaway (one-liner)..."
          maxLength={200}
          className="flex-1 text-xs px-2 py-1 border border-cyan-300 rounded bg-cyan-50 text-gray-800 outline-none focus:ring-1 focus:ring-cyan-400"
        />
      </div>
    );
  }

  if (value) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(value); setIsEditing(true); }}
        className="w-full text-left"
      >
        <p className="text-xs text-cyan-800 bg-cyan-50 border border-cyan-100 rounded px-2 py-1 italic leading-snug hover:bg-cyan-100 transition-colors">
          <span className="font-semibold not-italic text-cyan-600 mr-1">Takeaway:</span>
          {value}
        </p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(''); setIsEditing(true); }}
      className="text-[11px] text-gray-400 hover:text-cyan-600 transition-colors"
      title="Add a key takeaway"
    >
      + Add takeaway
    </button>
  );
}

/** Compact read-only takeaway shown on collapsed card */
export function TakeawayDisplay({ takeaway }: { takeaway: string }) {
  if (!takeaway) return null;
  return (
    <p className="text-xs text-cyan-700 bg-cyan-50/50 border border-cyan-100 rounded px-2 py-0.5 italic truncate">
      <span className="font-semibold not-italic text-cyan-600 mr-1">Takeaway:</span>
      {takeaway}
    </p>
  );
}
