import {
  Copy,
  Download,
  FileSpreadsheet,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { HydraStatusType, ManufRepairType, PlanRow } from '../types/plan';
import { buildFullPath, buildShortName } from '../utils/pathUtils';

interface ExcelTablePanelProps {
  rows: PlanRow[];
  filteredRows: PlanRow[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onUpdateRow: (id: string, field: keyof PlanRow, value: string) => void;
  onDeleteRow: (id: string) => void;
  onExportBackup: () => void;
  onCopyAllPaths: () => void;
  onCopySinglePath: (fullPath: string) => void;
}

export function ExcelTablePanel({
  rows,
  filteredRows,
  searchQuery,
  onSearchChange,
  onUpdateRow,
  onDeleteRow,
  onExportBackup,
  onCopyAllPaths,
  onCopySinglePath,
}: ExcelTablePanelProps) {
  return (
    <main className="w-[65%] flex-1 flex flex-col min-w-0 min-h-0 bg-[#F4F6F9]">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-4 shrink-0">
        {/* Search by Mold or Insert */}
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Mold or Insert..."
            aria-label="Search by Mold or Insert"
            className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-8 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0A1E5C] focus:outline-none focus:ring-1 focus:ring-[#0A1E5C]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCopyAllPaths}
            disabled={filteredRows.length === 0}
            className="bg-[#FF6A00] hover:bg-[#E55F00] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 px-4 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy All Paths</span>
          </button>

          <button
            type="button"
            onClick={onExportBackup}
            disabled={rows.length === 0}
            title="Download a separate backup .xlsx copy"
            className="bg-[#0A1E5C] hover:bg-[#08184A] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 px-3.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Copy</span>
          </button>
        </div>
      </div>

      {/* Table Viewport */}
      <div className="flex-1 p-4 min-h-0 flex flex-col">
        <div className="flex-1 bg-white border border-slate-300 rounded-sm overflow-auto flex flex-col">
          {rows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-3">
              <div className="w-12 h-12 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0A1E5C]">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="max-w-md flex flex-col gap-1">
                <h3 className="text-base font-semibold text-slate-900">
                  No parts added yet
                </h3>
                <p className="text-sm text-slate-600">
                  Connect your Excel workbook at the top, then paste a reference like{' '}
                  <span className="font-mono font-semibold text-slate-800">
                    21-1945002-00351
                  </span>{' '}
                  on the left and click{' '}
                  <span className="font-semibold text-[#0A1E5C]">
                    ADD TO TABLE - AUTO SAVE TO EXCEL
                  </span>
                  .
                </p>
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-3">
              <p className="text-sm text-slate-600">
                No table rows match &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-xs font-semibold text-[#0A1E5C] hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-[#0A1E5C] text-white">
                <tr>
                  <th className="px-3 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-2.5 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap w-20">
                    Plant
                  </th>
                  <th className="px-3 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap">
                    Mold
                  </th>
                  <th className="px-3 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap">
                    Insert
                  </th>
                  <th className="px-2.5 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap text-center w-24">
                    Needed Qty
                  </th>
                  <th className="px-2.5 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap text-center w-28">
                    Hydra Status
                  </th>
                  <th className="px-2.5 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap w-32">
                    Manuf/Repair
                  </th>
                  <th className="px-2.5 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap w-28">
                    Deadline
                  </th>
                  <th className="px-2.5 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap min-w-[110px]">
                    status2
                  </th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                    Plans
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const shortName = buildShortName(row.mold, row.insert);
                  const fullPath = buildFullPath(row.mold, row.insert);

                  return (
                    <tr
                      key={row.id}
                      className="group h-9.5 border-b border-slate-200 odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-3 py-1.5 border-r border-slate-200 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {row.date}
                      </td>

                      <td className="px-1.5 py-1 border-r border-slate-200">
                        <input
                          type="text"
                          value={row.plant}
                          onChange={(e) => onUpdateRow(row.id, 'plant', e.target.value)}
                          aria-label={`Plant for ${row.mold}-${row.insert}`}
                          className="w-full bg-transparent px-1.5 py-1 text-xs font-mono tabular-nums text-slate-800 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E5C]"
                        />
                      </td>

                      <td className="px-3 py-1.5 border-r border-slate-200 font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                        {row.mold}
                      </td>

                      <td className="px-3 py-1.5 border-r border-slate-200 font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                        {row.insert || '—'}
                      </td>

                      <td className="px-1.5 py-1 border-r border-slate-200">
                        <input
                          type="text"
                          value={row.neededQty}
                          onChange={(e) =>
                            onUpdateRow(row.id, 'neededQty', e.target.value)
                          }
                          aria-label={`Needed Qty for ${row.mold}-${row.insert}`}
                          className="w-full bg-transparent px-1.5 py-1 text-xs font-mono tabular-nums text-center font-semibold text-slate-900 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E5C]"
                        />
                      </td>

                      <td className="px-1.5 py-1 border-r border-slate-200">
                        <select
                          value={row.hydraStatus}
                          onChange={(e) =>
                            onUpdateRow(
                              row.id,
                              'hydraStatus',
                              e.target.value as HydraStatusType
                            )
                          }
                          aria-label={`Hydra Status for ${row.mold}-${row.insert}`}
                          className={`w-full bg-transparent px-1.5 py-1 text-xs rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E5C] cursor-pointer ${
                            row.hydraStatus === 'Yes'
                              ? 'font-semibold text-sky-700'
                              : 'text-slate-700'
                          }`}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>

                      <td className="px-1.5 py-1 border-r border-slate-200">
                        <select
                          value={row.manufRepair}
                          onChange={(e) => {
                            const val = e.target.value as ManufRepairType;
                            onUpdateRow(row.id, 'manufRepair', val);
                            if (val === 'Hydra') {
                              onUpdateRow(row.id, 'hydraStatus', 'Yes');
                            }
                          }}
                          aria-label={`Manuf/Repair for ${row.mold}-${row.insert}`}
                          className={`w-full bg-transparent px-1.5 py-1 text-xs font-semibold rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E5C] cursor-pointer ${
                            row.manufRepair === 'Repair'
                              ? 'text-amber-700'
                              : row.manufRepair === 'Hydra'
                              ? 'text-sky-700'
                              : 'text-[#0A1E5C]'
                          }`}
                        >
                          <option value="Manufacture">Manufacture</option>
                          <option value="Repair">Repair</option>
                          <option value="Hydra">Hydra</option>
                        </select>
                      </td>

                      <td className="px-1.5 py-1 border-r border-slate-200">
                        <input
                          type="text"
                          value={row.deadline}
                          onChange={(e) =>
                            onUpdateRow(row.id, 'deadline', e.target.value)
                          }
                          placeholder="DD/MM/YYYY"
                          aria-label={`Deadline for ${row.mold}-${row.insert}`}
                          className="w-full bg-transparent px-1.5 py-1 text-xs font-mono tabular-nums text-slate-800 placeholder:text-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E5C]"
                        />
                      </td>

                      <td className="px-1.5 py-1 border-r border-slate-200">
                        <input
                          type="text"
                          value={row.status2}
                          onChange={(e) =>
                            onUpdateRow(row.id, 'status2', e.target.value)
                          }
                          placeholder="—"
                          aria-label={`status2 for ${row.mold}-${row.insert}`}
                          className="w-full bg-transparent px-1.5 py-1 text-xs text-slate-800 placeholder:text-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E5C]"
                        />
                      </td>

                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <div className="flex items-center justify-between gap-2">
                          {shortName ? (
                            <a
                              href={fullPath}
                              title={fullPath}
                              onClick={(e) => {
                                e.preventDefault();
                                onCopySinglePath(fullPath);
                              }}
                              className="text-blue-700 hover:text-blue-900 underline text-xs font-mono cursor-pointer"
                            >
                              {shortName}
                            </a>
                          ) : (
                            <span>—</span>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteRow(row.id)}
                            title="Remove from on-screen list"
                            aria-label={`Remove row ${shortName}`}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-red-600 transition-opacity cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Quiet Table Summary Strip */}
        <div className="pt-2 px-1 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono tabular-nums">
            Showing {filteredRows.length} of {rows.length} plans
          </span>
          <span>Click any blue Plans filename to copy full path</span>
        </div>
      </div>
    </main>
  );
}
