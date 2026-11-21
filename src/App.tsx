import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { HeaderBar } from './components/HeaderBar';
import { InputPanel } from './components/InputPanel';
import { ExcelTablePanel } from './components/ExcelTablePanel';
import type { PlanRow } from './types/plan';
import {
  buildFullPath,
  getTodayFormatted,
  parseReferenceLines,
} from './utils/pathUtils';
import {
  checkExcelPermission,
  loadExcelHandle,
  requestExcelPermission,
  saveExcelHandle,
  type ExtendedFileSystemFileHandle,
} from './utils/excelHandleDb';
import {
  appendRowsToExcelHandle,
  downloadSnapshotWorkbook,
} from './utils/excelSheetJs';

const STORAGE_KEY = 'plans_finder_auto_excel_rows_v1';

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

  const [excelHandle, setExcelHandle] =
    useState<ExtendedFileSystemFileHandle | null>(null);
  const [hasWritePermission, setHasWritePermission] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Restore saved Excel file handle from IndexedDB on mount
  useEffect(() => {
    let active = true;
    loadExcelHandle()
      .then(async (handle) => {
        if (!active || !handle) return;
        setExcelHandle(handle);
        const perm = await checkExcelPermission(handle);
        if (active) {
          setHasWritePermission(perm === 'granted');
        }
      })
      .catch(() => {
        // Ignore IndexedDB unavailability
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // Ignore storage quota errors
    }
  }, [rows]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const parsedRefs = useMemo(
    () => parseReferenceLines(referenceText),
    [referenceText]
  );

  const showToast = (
    type: 'success' | 'warning' | 'error',
    message: string
  ) => {
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

  const handleConnectExcel = async () => {
    if (typeof window.showOpenFilePicker !== 'function') {
      const msg =
        'File System Access API is not supported in this browser or embedded frame. Please open this app directly in Chrome or Edge on PC.';
      setStatusBanner({ type: 'error', message: msg });
      showToast('error', msg);
      return;
    }

    setIsConnecting(true);
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'Excel Workbook (.xlsx, .xlsm)',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                ['.xlsx'],
              'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
            },
          },
        ],
      });

      if (!handle) return;

      const granted = await requestExcelPermission(handle);
      if (!granted) {
        setStatusBanner({
          type: 'warning',
          message: 'Write permission was not granted for the selected Excel file.',
        });
        return;
      }

      await saveExcelHandle(handle);
      setExcelHandle(handle);
      setHasWritePermission(true);
      setStatusBanner(null);
      showToast('success', `Connected to ${handle.name}`);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (err instanceof DOMException && err.name === 'SecurityError') {
        const msg =
          'Excel file picker is blocked inside an embedded iframe. Open this app in its own Chrome or Edge tab to connect a local Excel file.';
        setStatusBanner({ type: 'error', message: msg });
        showToast('error', msg);
        return;
      }
      const msg =
        err instanceof Error ? err.message : 'Failed to connect Excel file.';
      setStatusBanner({ type: 'error', message: msg });
      showToast('error', msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReconnectPermission = async () => {
    if (!excelHandle) return;
    try {
      const granted = await requestExcelPermission(excelHandle);
      setHasWritePermission(granted);
      if (granted) {
        setStatusBanner(null);
        showToast('success', `Write access restored for ${excelHandle.name}`);
      } else {
        showToast('warning', 'Write permission is required to auto-save.');
      }
    } catch {
      showToast('error', 'Could not restore file permission. Click CHANGE EXCEL FILE.');
    }
  };

  const handleCopyPath = () => {
    if (parsedRefs.length === 0) return;
    const text = parsedRefs.map((r) => r.fullPath).join('\n');
    copyToClipboard(
      text,
      parsedRefs.length === 1
        ? `Copied path: ${parsedRefs[0].fullPath}`
        : `Copied ${parsedRefs.length} paths to clipboard.`
    );
  };

  const handleAddAndSave = async () => {
    if (parsedRefs.length === 0) return;

    if (!excelHandle) {
      setStatusBanner({
        type: 'warning',
        message: 'Please Connect to Excel File First',
      });
      showToast('warning', 'Please Connect to Excel File First');
      return;
    }

    setIsSaving(true);
    try {
      const granted = await requestExcelPermission(excelHandle);
      setHasWritePermission(granted);
      if (!granted) {
        setStatusBanner({
          type: 'warning',
          message: 'Please grant write access to the connected Excel file.',
        });
        return;
      }

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

      await appendRowsToExcelHandle(excelHandle, newRows);

      setRows((prev) => [...newRows, ...prev]);
      setReferenceText('');
      setStatusBanner({
        type: 'success',
        message: 'Saved to Excel Automatically!',
      });
      showToast('success', 'Saved to Excel Automatically!');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not write to Excel file. Make sure the file is not locked by another program.';
      setStatusBanner({ type: 'error', message: msg });
      showToast('error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setReferenceText('');
    setStatusBanner(null);
  };

  const handleUpdateRow = (id: string, field: keyof PlanRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
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
      `Copied ${paths.length} ${paths.length === 1 ? 'path' : 'paths'} to clipboard.`
    );
  };

  const handleExportBackup = () => {
    const targetRows = filteredRows.length > 0 ? filteredRows : rows;
    if (targetRows.length === 0) return;
    downloadSnapshotWorkbook(targetRows);
    showToast('success', `Downloaded backup .xlsx (${targetRows.length} rows).`);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F4F6F9] text-slate-900">
      <HeaderBar
        totalRows={rows.length}
        connectedFileName={excelHandle?.name ?? null}
        hasWritePermission={hasWritePermission}
        onConnectExcel={handleConnectExcel}
        onReconnectPermission={handleReconnectPermission}
        isConnecting={isConnecting}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <InputPanel
          referenceText={referenceText}
          onReferenceTextChange={setReferenceText}
          parsedRefs={parsedRefs}
          onCopyPath={handleCopyPath}
          onAddAndSave={handleAddAndSave}
          onClear={handleClear}
          isSaving={isSaving}
          statusBanner={statusBanner}
        />

        <ExcelTablePanel
          rows={rows}
          filteredRows={filteredRows}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUpdateRow={handleUpdateRow}
          onDeleteRow={handleDeleteRow}
          onExportBackup={handleExportBackup}
          onCopyAllPaths={handleCopyAllPaths}
          onCopySinglePath={(fullPath) =>
            copyToClipboard(fullPath, `Copied path: ${fullPath}`)
          }
        />
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-md shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-700 text-white border-emerald-800'
              : toast.type === 'warning'
              ? 'bg-amber-500 text-slate-950 border-amber-600'
              : 'bg-red-700 text-white border-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          ) : toast.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span className="max-w-md truncate">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
