import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Search,
  X,
} from 'lucide-react';
import { HeaderBar } from './components/HeaderBar';
import { InputPanel } from './components/InputPanel';
import { ExcelTablePanel } from './components/ExcelTablePanel';
import { RowDetailSheet } from './components/RowDetailSheet';
import type { PlanRow } from './types/plan';
import {
  buildFullPath,
  getTodayFormatted,
  parseReferenceLines,
} from './utils/pathUtils';
import { exportPlansToExcel } from './utils/excelSheetJs';

const STORAGE_KEY = 'plans_finder_mobile_rows_v1';

export default function App() {
  const [rows, setRows] = useState<PlanRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [referenceText, setReferenceText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailRowId, setDetailRowId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // Ignore storage quota errors
    }
  }, [rows]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const parsedRefs = useMemo(
    () => parseReferenceLines(referenceText),
    [referenceText]
  );

  const detailRow = useMemo(
    () => rows.find((r) => r.id === detailRowId) ?? null,
    [rows, detailRowId]
  );

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text.trim()) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('success', label);
    } catch {
      showToast('error', 'Unable to copy to clipboard.');
    }
  };

  const handleAdd = () => {
    if (parsedRefs.length === 0) return;
    const today = getTodayFormatted();
    const now = Date.now();

    const newRows: PlanRow[] = parsedRefs.map((ref, idx) => ({
      id: crypto.randomUUID(),
      date: today,
      plant: '1310',
      mold: ref.mold,
      insert: ref.insert,
      neededQty: '1',
      hydraStatus: 'No',
      manufRepair: 'Manufacture',
      deadline: '',
      status2: '',
      createdAt: now + idx,
    }));

    setRows((prev) => [...newRows, ...prev]);
    setReferenceText('');
    showToast(
      'success',
      newRows.length === 1
        ? `Added ${newRows[0].mold}${newRows[0].insert ? `-${newRows[0].insert}` : ''}`
        : `Added ${newRows.length} parts`
    );
  };

  const handleCopyPath = () => {
    if (parsedRefs.length === 0) return;
    const text = parsedRefs.map((r) => r.fullPath).join('\n');
    copyToClipboard(
      text,
      parsedRefs.length === 1
        ? `Copied: ${parsedRefs[0].shortName}`
        : `Copied ${parsedRefs.length} paths`
    );
  };

  const handleUpdateRow = (id: string, field: keyof PlanRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    showToast('success', 'Part removed');
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const combined = `${row.mold}-${row.insert}`.toLowerCase();
      return (
        row.mold.toLowerCase().includes(q) ||
        row.insert.toLowerCase().includes(q) ||
        combined.includes(q)
      );
    });
  }, [rows, searchQuery]);

  const handleCopyAllPaths = () => {
    const paths = filteredRows
      .map((r) => buildFullPath(r.mold, r.insert))
      .filter(Boolean);
    if (paths.length === 0) return;
    copyToClipboard(
      paths.join('\n'),
      `Copied ${paths.length} ${paths.length === 1 ? 'path' : 'paths'}`
    );
  };

  const handleExportExcel = () => {
    const targetRows = filteredRows.length > 0 ? filteredRows : rows;
    if (targetRows.length === 0) return;
    exportPlansToExcel(targetRows);
    showToast('success', `Exported ${targetRows.length} parts (.xlsx)`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-slate-900 pb-20">
      <HeaderBar totalRows={rows.length} />

      {/* Main Single-Column Mobile Stack */}
      <main className="w-full max-w-2xl mx-auto px-3 pt-3 flex-1 flex flex-col gap-3">
        {/* Big Search Bar on Top */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Mold or Insert..."
            aria-label="Search Mold or Insert"
            className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white pl-11 pr-11 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0A1E5C] focus:outline-none focus:ring-2 focus:ring-[#0A1E5C]/15"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input Section */}
        <InputPanel
          referenceText={referenceText}
          onReferenceTextChange={setReferenceText}
          parsedRefs={parsedRefs}
          onAdd={handleAdd}
          onCopyPath={handleCopyPath}
        />

        {/* Scrollable Table Below Input */}
        <ExcelTablePanel
          rows={rows}
          filteredRows={filteredRows}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          onUpdateRow={handleUpdateRow}
          onSelectDetailRow={(row) => setDetailRowId(row.id)}
          onCopySinglePath={(fullPath) =>
            copyToClipboard(fullPath, `Copied: ${fullPath}`)
          }
        />
      </main>

      {/* Sticky Bottom Thumb Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5">
        <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={rows.length === 0}
            className="min-h-[48px] bg-[#FF6A00] hover:bg-[#E55F00] active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Export to Excel</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAllPaths}
            disabled={filteredRows.length === 0}
            className="min-h-[48px] bg-[#0A1E5C] hover:bg-[#08184A] active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Copy className="w-4 h-4 shrink-0" />
            <span>Copy All Paths</span>
          </button>
        </div>
      </div>

      {/* Detail View Bottom Sheet for Plant, Hydra Status & status2 */}
      <RowDetailSheet
        row={detailRow}
        onClose={() => setDetailRowId(null)}
        onUpdateRow={handleUpdateRow}
        onDeleteRow={handleDeleteRow}
        onCopyPath={(fullPath) =>
          copyToClipboard(fullPath, `Copied: ${fullPath}`)
        }
      />

      {/* Mobile Toast Above Sticky Bottom Bar */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 left-3 right-3 z-40 max-w-md mx-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-[#0A1E5C] text-white border-[#1E3A8A]'
              : 'bg-red-700 text-white border-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span className="truncate">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
