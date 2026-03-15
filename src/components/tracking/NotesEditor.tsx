import { useState, useEffect, useRef } from 'react';

interface NotesEditorProps {
  notes: string;
  onSave: (notes: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function NotesEditor({ notes, onSave, isOpen, onClose }: NotesEditorProps) {
  const [value, setValue] = useState(notes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(notes);
  }, [notes]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">Personal Notes</label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onSave(value)}
        placeholder="Add your notes about this paper..."
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-y min-h-20"
        rows={3}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function NotesIndicator({ hasNotes, onClick }: { hasNotes: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1 rounded transition-colors ${
        hasNotes
          ? 'text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
      aria-label={hasNotes ? 'Edit notes' : 'Add notes'}
      title={hasNotes ? 'Edit notes' : 'Add notes'}
    >
      <svg className="h-4 w-4" fill={hasNotes ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    </button>
  );
}
