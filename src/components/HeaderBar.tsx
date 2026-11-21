import { FileSpreadsheet } from 'lucide-react';

interface HeaderBarProps {
  totalRows: number;
}

export function HeaderBar({ totalRows }: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-30 h-12 bg-[#0A1E5C] text-white px-4 flex items-center justify-between gap-4 border-b border-[#061442]">
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#FF6A00] flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-4 h-4 text-white" strokeWidth={2.2} />
        </div>
        <h1 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-white">
          Plans Finder
        </h1>
      </div>

      <div className="text-xs font-medium text-slate-200 whitespace-nowrap shrink-0">
        <span className="font-mono tabular-nums font-bold text-white">
          {totalRows}
        </span>{' '}
        {totalRows === 1 ? 'Plan' : 'Plans'}
      </div>
    </header>
  );
}
