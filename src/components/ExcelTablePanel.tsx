import { FileSpreadsheet } from 'lucide-react';
import type { ManufRepairType, PlanRow } from '../types/plan';
import { buildFullPath, buildShortName } from '../utils/pathUtils';

interface ExcelTablePanelProps {
  rows: PlanRow[];
  filteredRows: PlanRow[];
  searchQuery: string;
  onClearSearch: () => void;
  onUpdateRow: (id: string, field: keyof PlanRow, value: string) => void;
  onSelectDetailRow: (row: PlanRow) => void;
  onCopySinglePath: (fullPath: string) => void;
}

export function ExcelTablePanel({
  rows,
  filteredRows,
  searchQuery,
  onClearSearch,
  onUpdateRow,
  onSelectDetailRow,
  onCopySinglePath,
}: ExcelTablePanelProps) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Section Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
        <span className="font-bold text-[#0A1E5C]">
          Logged Parts ({filteredRows.length})
        </span>
        <span className="text-slate-500">Tap Mold for Plant / Hydra details</span>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center text-center gap-2.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-[#0A1E5C]">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            No parts added yet. Enter a reference above and tap ADD.
          </p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center text-center gap-2.5">
          <p className="text-sm text-slate-600">
            No results for &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={onClearSearch}
            className="min-h-[44px] px-4 text-sm font-bold text-[#FF6A00] cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[52vh] overflow-y-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[#0A1E5C] text-white">
              <tr>
                <th className="px-3 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap">
                  Date
                </th>
                <th className="px-3 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap">
                  Mold
                </th>
                <th className="px-3 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap">
                  Insert
                </th>
                <th className="px-2.5 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap text-center">
                  Needed Qty
                </th>
                <th className="px-2.5 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap">
                  Manuf/Repair
                </th>
                <th className="px-2.5 py-2.5 border-r border-[#1E3A8A] font-semibold whitespace-nowrap">
                  Deadline
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
                    className="h-11 border-b border-slate-200 odd:bg-white even:bg-slate-50/70"
                  >
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {row.date}
                    </td>

                    <td className="px-2 py-1 border-r border-slate-200 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectDetailRow(row)}
                        className="min-h-[36px] px-1.5 font-mono tabular-nums font-bold text-[#0A1E5C] hover:underline text-left cursor-pointer"
                      >
                        {row.mold}
                      </button>
                    </td>

                    <td className="px-2 py-1 border-r border-slate-200 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectDetailRow(row)}
                        className="min-h-[36px] px-1.5 font-mono tabular-nums font-semibold text-slate-900 text-left cursor-pointer"
                      >
                        {row.insert || '—'}
                      </button>
                    </td>

                    <td className="px-1.5 py-1 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.neededQty}
                        onChange={(e) =>
                          onUpdateRow(row.id, 'neededQty', e.target.value)
                        }
                        aria-label={`Needed Qty for ${shortName}`}
                        className="w-14 min-h-[36px] bg-transparent px-1.5 text-xs font-mono tabular-nums text-center font-semibold text-slate-900 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E5C]"
                      />
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
                        aria-label={`Manuf/Repair for ${shortName}`}
                        className={`min-h-[36px] bg-transparent px-1.5 text-xs font-semibold rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E5C] cursor-pointer ${
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
                        aria-label={`Deadline for ${shortName}`}
                        className="w-24 min-h-[36px] bg-transparent px-1.5 text-xs font-mono tabular-nums text-slate-800 placeholder:text-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E5C]"
                      />
                    </td>

                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {shortName ? (
                        <a
                          href={fullPath}
                          title={fullPath}
                          onClick={(e) => {
                            e.preventDefault();
                            onCopySinglePath(fullPath);
                          }}
                          className="inline-flex items-center min-h-[36px] text-blue-700 hover:text-blue-900 underline text-xs font-mono cursor-pointer"
                        >
                          {shortName}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
