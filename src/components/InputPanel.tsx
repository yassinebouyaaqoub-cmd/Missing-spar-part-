import type { KeyboardEvent } from 'react';
import { Copy, Plus, X } from 'lucide-react';
import type { SplitReference } from '../utils/pathUtils';

interface InputPanelProps {
  referenceText: string;
  onReferenceTextChange: (value: string) => void;
  parsedRefs: SplitReference[];
  onAdd: () => void;
  onCopyPath: () => void;
}

export function InputPanel({
  referenceText,
  onReferenceTextChange,
  parsedRefs,
  onAdd,
  onCopyPath,
}: InputPanelProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (parsedRefs.length > 0) {
        onAdd();
      }
    }
  };

  const singleRef = parsedRefs.length === 1 ? parsedRefs[0] : null;
  const isBulk = parsedRefs.length > 1;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3.5">
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="mobile-reference-input"
          className="text-base font-bold text-[#0A1E5C]"
        >
          Enter Reference
        </label>
        {referenceText.length > 0 && (
          <button
            type="button"
            onClick={() => onReferenceTextChange('')}
            className="min-h-[36px] px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Big Reference Input */}
      <textarea
        id="mobile-reference-input"
        value={referenceText}
        onChange={(e) => onReferenceTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="21-1945002-00351"
        className="w-full rounded-xl border-2 border-slate-300 bg-slate-50/50 px-4 py-3 text-lg font-mono font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#0A1E5C] focus:bg-white focus:outline-none leading-snug resize-none"
      />

      {/* Instant Split Preview: Mold, Insert, Short Name */}
      {!isBulk ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500">Mold</span>
              <span className="text-base font-mono font-bold text-slate-900 truncate">
                {singleRef?.mold || '—'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500">Insert</span>
              <span className="text-base font-mono font-bold text-[#0A1E5C] truncate">
                {singleRef?.insert || '—'}
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-500 shrink-0">
              Short Name:
            </span>
            <span className="font-mono font-semibold text-blue-700 truncate">
              {singleRef?.shortName || '21-1945002-00351.pdf'}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#0A1E5C]">
            <span>{parsedRefs.length} References Ready</span>
            <span className="font-normal text-slate-500">Tap ADD to insert all</span>
          </div>
          <div className="max-h-28 overflow-y-auto flex flex-col gap-1">
            {parsedRefs.map((ref, idx) => (
              <div
                key={`${ref.raw}-${idx}`}
                className="text-xs font-mono text-slate-800 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
              >
                <span className="font-semibold">{ref.mold}</span>
                <span className="text-[#0A1E5C] font-semibold">{ref.insert || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Big Thumb-Friendly Full-Width Buttons */}
      <div className="flex flex-col gap-2.5 pt-0.5">
        <button
          type="button"
          onClick={onAdd}
          disabled={parsedRefs.length === 0}
          className="w-full min-h-[54px] bg-[#FF6A00] hover:bg-[#E55F00] active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
          <span>{isBulk ? `ADD (${parsedRefs.length})` : 'ADD'}</span>
        </button>

        <button
          type="button"
          onClick={onCopyPath}
          disabled={parsedRefs.length === 0}
          className="w-full min-h-[50px] bg-[#0A1E5C] hover:bg-[#08184A] active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Copy className="w-5 h-5" />
          <span>{isBulk ? `COPY PATH (${parsedRefs.length})` : 'COPY PATH'}</span>
        </button>
      </div>
    </section>
  );
}
