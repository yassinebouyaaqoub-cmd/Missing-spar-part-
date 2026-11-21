import { FileSpreadsheet, FolderOpen, RefreshCw, ShieldAlert } from 'lucide-react';

interface HeaderBarProps {
  totalRows: number;
  connectedFileName: string | null;
  hasWritePermission: boolean;
  onConnectExcel: () => void;
  onReconnectPermission: () => void;
  isConnecting: boolean;
}

export function HeaderBar({
  totalRows,
  connectedFileName,
  hasWritePermission,
  onConnectExcel,
  onReconnectPermission,
  isConnecting,
}: HeaderBarProps) {
  return (
    <header className="h-16 bg-[#0A1E5C] text-white px-6 flex items-center justify-between gap-8 shrink-0 border-b border-[#061442]">
      {/* Brand Wordmark */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded bg-[#FF6A00] flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
        </div>
        <h1 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-white">
          Plans Finder - Auto Excel
        </h1>
      </div>

      {/* Center Quiet Status */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-300 font-medium whitespace-nowrap shrink-0">
        <span className="font-mono tabular-nums text-white font-semibold">{totalRows}</span>
        <span>{totalRows === 1 ? 'Plan Logged' : 'Plans Logged'}</span>
        <span aria-hidden="true" className="text-slate-500">·</span>
        <span>Default Plant 1310</span>
      </div>

      {/* Right: Excel File Connection Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {!connectedFileName ? (
          <button
            type="button"
            onClick={onConnectExcel}
            disabled={isConnecting}
            className="bg-[#FF6A00] hover:bg-[#E55F00] active:bg-[#CC5500] disabled:bg-slate-400 text-white text-sm font-bold py-2.5 px-5 rounded-md transition-colors flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
          >
            <FolderOpen className="w-4 h-4" />
            <span>CONNECT TO EXCEL FILE</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs whitespace-nowrap">
              <FileSpreadsheet
                className={`w-4 h-4 shrink-0 ${
                  hasWritePermission ? 'text-emerald-400' : 'text-amber-300'
                }`}
              />
              <span className="text-slate-300">Connected:</span>
              <span
                title={connectedFileName}
                className="font-mono font-semibold text-white max-w-[280px] truncate"
              >
                {connectedFileName}
              </span>
            </div>

            {!hasWritePermission && (
              <button
                type="button"
                onClick={onReconnectPermission}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-1.5 px-3 rounded transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Allow Write Access</span>
              </button>
            )}

            <button
              type="button"
              onClick={onConnectExcel}
              disabled={isConnecting}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs font-semibold py-2 px-3.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>CHANGE EXCEL FILE</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
