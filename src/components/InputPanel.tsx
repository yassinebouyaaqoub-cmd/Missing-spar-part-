import type { KeyboardEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  RotateCcw,
} from 'lucide-react';
import type { SplitReference } from '../utils/pathUtils';

interface InputPanelProps {
  referenceText: string;
  onReferenceTextChange: (value: string) => void;
  parsedRefs: SplitReference[];
  onCopyPath: () => void;
  onAddAndSave: () => void;
  onClear: () => void;
  isSaving: boolean;
  statusBanner: {
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null;
}

export function InputPanel({
  referenceText,
  onReferenceTextChange,
  parsedRefs,
  onCopyPath,
  onAddAndSave,
  onClear,
  isSaving,
  statusBanner,
}: InputPanelProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSaving && parsedRefs.length > 0) {
        onAddAndSave();
      }
    }
  };

  const singleRef = parsedRefs.length === 1 ? parsedRefs[0] : null;
  const isBulk = parsedRefs.length > 1;

  return (
    <aside className="w-[35%] min-w-[400px] max-w-[560px] bg-white border-r border-slate-200 flex flex-col min-h-0">
      {/* Dark Blue Panel Header */}
      <div className="bg-[#0A1E5C] text-white px-5 py-3 flex items-center justify-between border-b border-[#061442] shrink-0">
        <h2 className="font-[var(--font-display)] text-sm font-semibold tracking-wide">
          Add New Part
        </h2>
        <span className="text-xs text-slate-300">Auto-Save to Excel</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {/* Big Reference Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="reference-input"
              className="text-sm font-semibold text-slate-800"
            >
              Enter Reference
            </label>
            <span className="text-xs text-slate-500">
              Enter to Add · Shift+Enter for new line
            </span>
          </div>

          <textarea
            id="reference-input"
            value={referenceText}
            onChange={(e) => onReferenceTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            autoFocus
            placeholder="21-1945002-00351"
            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-3 text-base font-mono text-slate-900 placeholder:text-slate-400 focus:border-[#0A1E5C] focus:outline-none focus:ring-2 focus:ring-[#0A1E5C]/15 leading-relaxed resize-y min-h-[112px]"
          />
          <p className="text-xs text-slate-500">
            Paste one reference or multiple references (one per line) to add and save all at once.
          </p>
        </div>

        {/* Status Banner */}
        {statusBanner && (
          <div
            role="status"
            className={`px-3.5 py-2.5 rounded-md border text-sm flex items-start gap-2.5 ${
              statusBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : statusBanner.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  statusBanner.type === 'warning' ? 'text-amber-600' : 'text-red-600'
                }`}
              />
            )}
            <span className="font-semibold">{statusBanner.message}</span>
          </div>
        )}

        {/* Auto-filled Split Output */}
        {!isBulk ? (
          <div className="border border-slate-200 rounded-md bg-slate-50/70 p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Mold</span>
                <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm font-mono font-semibold text-slate-900 min-h-[38px] flex items-center">
                  {singleRef?.mold || <span className="text-slate-400 font-normal">—</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Insert</span>
                <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm font-mono font-semibold text-slate-900 min-h-[38px] flex items-center">
                  {singleRef?.insert || <span className="text-slate-400 font-normal">—</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Full Path</span>
              <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 break-all min-h-[42px] flex items-center leading-snug">
                {singleRef?.fullPath || (
                  <span className="text-slate-400">
                    Y:/18.%20Molds/&#123;Mold&#125;/&#123;Insert&#125;/Plans/&#123;Mold&#125;-&#123;Insert&#125;.pdf
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-md bg-slate-50/70 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A1E5C]">
                Bulk Preview ({parsedRefs.length} References)
              </span>
              <span className="text-xs text-slate-500">Ready to append all</span>
            </div>

            <div className="max-h-[210px] overflow-y-auto flex flex-col gap-1.5 pr-1">
              {parsedRefs.map((item, idx) => (
                <div
                  key={`${item.raw}-${idx}`}
                  className="bg-white border border-slate-200 rounded px-2.5 py-2 flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-900">
                      Mold: {item.mold}
                    </span>
                    <span className="font-semibold text-[#0A1E5C]">
                      Insert: {item.insert || '—'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {item.fullPath}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCopyPath}
            disabled={parsedRefs.length === 0}
            className="w-full bg-[#FF6A00] hover:bg-[#E55F00] active:bg-[#CC5500] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 px-5 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Copy className="w-4 h-4" />
            <span>
              {isBulk ? `COPY PATH (${parsedRefs.length})` : 'COPY PATH'}
            </span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onAddAndSave}
              disabled={parsedRefs.length === 0 || isSaving}
              className="flex-1 bg-[#0A1E5C] hover:bg-[#08184A] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold py-2.5 px-3.5 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SAVING TO EXCEL...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>
                    {isBulk
                      ? `ADD TO TABLE (${parsedRefs.length}) - AUTO SAVE TO EXCEL`
                      : 'ADD TO TABLE - AUTO SAVE TO EXCEL'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClear}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold py-2.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
