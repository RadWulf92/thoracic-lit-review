import { useState, useCallback, useRef, useEffect } from 'react';
import type { TrialData } from '../../types/paper';

interface TrialDataEditorProps {
  data: TrialData | undefined;
  onSave: (data: TrialData) => void;
}

const INPUT_CLASS =
  'w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 placeholder:text-gray-300';
const TEXTAREA_CLASS =
  'w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 placeholder:text-gray-300 resize-none';
const LABEL_CLASS = 'block text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider';

interface FieldProps {
  label: string;
  field: keyof TrialData;
  placeholder?: string;
  className?: string;
  textarea?: boolean;
}

interface TrialDataFieldProps extends FieldProps {
  draft: TrialData;
  updateField: (field: keyof TrialData, value: string) => void;
}

function TrialDataField({
  label,
  field,
  placeholder,
  className,
  textarea,
  draft,
  updateField,
}: TrialDataFieldProps) {
  return (
    <div className={className}>
      <label className={LABEL_CLASS}>{label}</label>
      {textarea ? (
        <textarea
          className={TEXTAREA_CLASS}
          rows={2}
          value={(draft[field] as string) ?? ''}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          className={INPUT_CLASS}
          value={(draft[field] as string) ?? ''}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

export function TrialDataEditor({ data, onSave }: TrialDataEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<TrialData>(data ?? {});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoSave = useCallback(
    (updatedDraft: TrialData) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        // Only save if there's at least one non-empty field
        const hasData = Object.entries(updatedDraft).some(
          ([k, v]) => k !== 'trialDataUpdatedAt' && v && String(v).trim()
        );
        if (hasData) {
          onSave(updatedDraft);
        }
      }, 1500);
    },
    [onSave]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const updateField = (field: keyof TrialData, value: string) => {
    const updated = { ...draft, [field]: value };
    setDraft(updated);
    scheduleAutoSave(updated);
  };

  const hasData = data && Object.entries(data).some(
    ([k, v]) => k !== 'trialDataUpdatedAt' && v && String(v).trim()
  );
  const fieldProps = { draft, updateField };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <svg className={`h-4 w-4 ${hasData ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Trial Data
          {hasData && <span className="text-[10px] text-emerald-500 font-normal">(saved)</span>}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-3 space-y-3 bg-white">
          {/* Study Design */}
          <div>
            <h4 className="text-[11px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              Study Design
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <TrialDataField {...fieldProps} label="Trial Name" field="trialName" placeholder="e.g., KEYNOTE-024" className="col-span-2 sm:col-span-1" />
              <TrialDataField {...fieldProps} label="Phase" field="phase" placeholder="e.g., III" />
              <TrialDataField {...fieldProps} label="Design" field="design" placeholder="e.g., Randomized" />
              <TrialDataField {...fieldProps} label="N Patients" field="nPatients" placeholder="e.g., 305" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <TrialDataField {...fieldProps} label="Setting" field="setting" placeholder="e.g., 1L metastatic" />
              <TrialDataField {...fieldProps} label="Histology" field="histology" placeholder="e.g., NSCLC" />
              <TrialDataField {...fieldProps} label="Stage" field="stage" placeholder="e.g., IV" />
              <TrialDataField {...fieldProps} label="Biomarker" field="biomarkerSelection" placeholder="e.g., PD-L1 >=50%" />
            </div>
          </div>

          {/* Interventions */}
          <div>
            <h4 className="text-[11px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
              Interventions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <TrialDataField {...fieldProps} label="Experimental Arm" field="experimentalArm" placeholder="e.g., Pembrolizumab + chemo" />
              <TrialDataField {...fieldProps} label="Control Arm" field="controlArm" placeholder="e.g., Placebo + chemo" />
            </div>
          </div>

          {/* Results */}
          <div>
            <h4 className="text-[11px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Results
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <TrialDataField {...fieldProps} label="Primary Endpoint" field="primaryEndpoint" placeholder="e.g., PFS" />
              <TrialDataField {...fieldProps} label="Median (Exp)" field="medianExpArm" placeholder="e.g., 10.3 mo" />
              <TrialDataField {...fieldProps} label="Median (Ctrl)" field="medianCtrlArm" placeholder="e.g., 6.0 mo" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <TrialDataField {...fieldProps} label="Hazard Ratio" field="hazardRatio" placeholder="e.g., 0.50 (0.37-0.68)" />
              <TrialDataField {...fieldProps} label="p-value" field="pValue" placeholder="e.g., <0.001" />
              <TrialDataField {...fieldProps} label="ORR (Exp)" field="orrExpArm" placeholder="e.g., 44.8%" />
              <TrialDataField {...fieldProps} label="ORR (Ctrl)" field="orrCtrlArm" placeholder="e.g., 27.8%" />
            </div>
            <div className="mt-2">
              <TrialDataField {...fieldProps} label="Other Key Results" field="secondaryResults" placeholder="e.g., mOS 30.0 vs 14.2 mo, HR 0.63; 5-yr OS 31.9% vs 16.3%" textarea />
            </div>
          </div>

          {/* Safety */}
          <div>
            <h4 className="text-[11px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              Safety
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <TrialDataField {...fieldProps} label="Grade 3+ AE Rate" field="grade3PlusRate" placeholder="e.g., 54% vs 35%" />
              <TrialDataField {...fieldProps} label="Discontinuation Rate" field="discontinuationRate" placeholder="e.g., 15% vs 8%" />
            </div>
            <div className="mt-2">
              <TrialDataField {...fieldProps} label="Key Toxicities" field="keyToxicities" placeholder="e.g., Pneumonitis 5%, colitis 2%" textarea />
            </div>
          </div>

          <p className="text-[10px] text-gray-300 italic">Auto-saves as you type</p>
        </div>
      )}
    </div>
  );
}
