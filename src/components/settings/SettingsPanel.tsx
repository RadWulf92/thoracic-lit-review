import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { JournalInfo } from '../../constants/journals';
import type { Collection } from '../../utils/queryBuilder';
import { AuthSection } from './AuthSection';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeCollection: Collection;
}

const FALLBACK_COLORS = [
  'journal-jto', 'journal-lung-cancer', 'journal-lancet-oncol', 'journal-jco',
  'journal-ann-oncol', 'journal-nejm', 'journal-chest', 'journal-erj',
  'journal-clin-lung', 'journal-transl-lung',
];

const COLLECTION_LABELS: Record<Collection, { title: string; accent: string; accentBg: string; btnColor: string; btnHover: string; tag: string }> = {
  'thoracic': {
    title: 'Thoracic Oncology Journals',
    accent: 'text-cyan-600',
    accentBg: 'bg-cyan-50',
    btnColor: 'bg-cyan-600',
    btnHover: 'hover:bg-cyan-700',
    tag: 'Thoracic-specific',
  },
  'acute-oncology': {
    title: 'Acute Oncology Journals',
    accent: 'text-orange-600',
    accentBg: 'bg-orange-50',
    btnColor: 'bg-orange-600',
    btnHover: 'hover:bg-orange-700',
    tag: 'Acute-specific',
  },
};

export function SettingsPanel({ isOpen, onClose, activeCollection }: SettingsPanelProps) {
  const {
    journals, addJournal, removeJournal, resetJournals,
    acuteJournals, addAcuteJournal, removeAcuteJournal, resetAcuteJournals,
  } = useSettingsStore();

  const isAcute = activeCollection === 'acute-oncology';
  const displayJournals = isAcute ? acuteJournals : journals;
  const handleAdd = isAcute ? addAcuteJournal : addJournal;
  const handleRemove = isAcute ? removeAcuteJournal : removeJournal;
  const handleReset = isAcute ? resetAcuteJournals : resetJournals;
  const collStyle = COLLECTION_LABELS[activeCollection];

  const [newName, setNewName] = useState('');
  const [newAbbrev, setNewAbbrev] = useState('');
  const [newIsThoracic, setNewIsThoracic] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const onAdd = () => {
    if (!newName.trim() || !newAbbrev.trim()) {
      setError('Both name and PubMed abbreviation are required.');
      return;
    }
    if (displayJournals.some(j => j.abbrev === newAbbrev.trim())) {
      setError('A journal with this abbreviation already exists.');
      return;
    }

    const color = FALLBACK_COLORS[displayJournals.length % FALLBACK_COLORS.length];
    const journal: JournalInfo = {
      full: newName.trim(),
      abbrev: newAbbrev.trim(),
      issn: '',
      color,
      isThoracicSpecific: newIsThoracic,
    };

    handleAdd(journal);
    setNewName('');
    setNewAbbrev('');
    setNewIsThoracic(false);
    setError('');
  };

  const onRemoveJournal = (abbrev: string) => {
    if (window.confirm(`Remove ${abbrev} from this collection's journal list? Existing notes and cached papers will stay saved.`)) {
      handleRemove(abbrev);
    }
  };

  const onResetJournals = () => {
    if (window.confirm(`Reset the ${isAcute ? 'acute oncology' : 'thoracic oncology'} journal list to defaults? Existing notes and cached papers will stay saved.`)) {
      handleReset();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md bg-white shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AuthSection />

          {/* Collection indicator */}
          <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${collStyle.accentBg}`}>
            <span className={`text-xs font-medium ${collStyle.accent}`}>
              Current section:
            </span>
            <span className={`text-xs font-bold ${collStyle.accent}`}>
              {isAcute ? 'Acute Oncology' : 'Thoracic Oncology'}
            </span>
          </div>

          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {collStyle.title} ({displayJournals.length})
          </h3>

          {/* Journal list */}
          <div className="space-y-2 mb-6">
            {displayJournals.map(journal => (
              <div
                key={journal.abbrev}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{journal.full}</p>
                  <p className="text-xs text-gray-500">
                    {journal.abbrev}
                    {journal.isThoracicSpecific && (
                      <span className="ml-2 text-cyan-600">{collStyle.tag}</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveJournal(journal.abbrev)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove journal"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add journal form */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Journal</h3>

            {error && (
              <p className="text-xs text-red-600 mb-2">{error}</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., Nature Medicine"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  PubMed Abbreviation
                  <span className="text-gray-400 ml-1">(used in search query)</span>
                </label>
                <input
                  type="text"
                  value={newAbbrev}
                  onChange={e => setNewAbbrev(e.target.value)}
                  placeholder="e.g., Nat Med"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              {!isAcute && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsThoracic}
                      onChange={e => setNewIsThoracic(e.target.checked)}
                      className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-600">Thoracic-specific journal</span>
                  </label>
                  <p className="text-xs text-gray-400">
                    Thoracic-specific journals fetch all papers. Other journals are filtered by lung cancer / thoracic oncology terms.
                  </p>
                </>
              )}
              {isAcute && (
                <p className="text-xs text-gray-400">
                  All acute oncology journals are filtered by acute oncology search terms (emergencies, toxicity, supportive care, etc.)
                </p>
              )}
              <button
                type="button"
                onClick={onAdd}
                className={`w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${collStyle.btnColor} ${collStyle.btnHover}`}
              >
                Add Journal
              </button>
            </div>
          </div>

          {/* Reset */}
          <div className="border-t border-gray-200 mt-6 pt-4">
            <button
              type="button"
              onClick={onResetJournals}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Reset to default {isAcute ? 'acute oncology' : 'thoracic'} journals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
