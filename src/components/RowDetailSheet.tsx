import { Copy, Trash2, X } from 'lucide-react';
import type { HydraStatusType, ManufRepairType, PlanRow } from '../types/plan';
import { buildFullPath, buildShortName } from '../utils/pathUtils';

interface RowDetailSheetProps {
  row: PlanRow | null;
  onClose: () => void;
  onUpdateRow: (id: string, field: keyof PlanRow, value: string) => void;
  onDeleteRow: (id: string) => void;
  onCopyPath: (fullPath: string) => void;
}

export function RowDetailSheet({
  row,
  onClose,
  onUpdateRow,
  onDeleteRow,
  onCopyPath,
}: RowDetailSheetProps) {
  if (!row) return null;

  const shortName = buildShortName(row.mold, row.insert);
  const fullPath = buildFullPath(row.mold, row.insert);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-[#0A1E5C] font-mono">
              {row.mold}
              {row.insert ? `-${row.insert}` : ''}
            </h3>
            <p className="text-xs text-slate-500">
              Logged {row.date} · Part Details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Fields */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">
                Plant
              </label>
              <input
                type="text"
                value={row.plant}
                onChange={(e) => onUpdateRow(row.id, 'plant', e.target.value)}
                className="min-h-[46px] rounded-xl border border-slate-300 px-3 text-base font-mono text-slate-900 focus:border-[#0A1E5C] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">
                Hydra Status
              </label>
              <select
                value={row.hydraStatus}
                onChange={(e) =>
                  onUpdateRow(
                    row.id,
                    'hydraStatus',
                    e.target.value as HydraStatusType
                  )
                }
                className="min-h-[46px] rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#0A1E5C] focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">
                Needed Qty
              </label>
              <input
                type="text"
                value={row.neededQty}
                onChange={(e) =>
                  onUpdateRow(row.id, 'neededQty', e.target.value)
                }
                className="min-h-[46px] rounded-xl border border-slate-300 px-3 text-base font-mono text-slate-900 focus:border-[#0A1E5C] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">
                Manuf/Repair
              </label>
              <select
                value={row.manufRepair}
                onChange={(e) => {
                  const val = e.target.value as ManufRepairType;
                  onUpdateRow(row.id, 'manufRepair', val);
                  if (val === 'Hydra') {
                    onUpdateRow(row.id, 'hydraStatus', 'Yes');
                  }
                }}
                className="min-h-[46px] rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#0A1E5C] focus:outline-none"
              >
                <option value="Manufacture">Manufacture</option>
                <option value="Repair">Repair</option>
                <option value="Hydra">Hydra</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">
                Deadline
              </label>
              <input
                type="text"
                value={row.deadline}
                onChange={(e) =>
                  onUpdateRow(row.id, 'deadline', e.target.value)
                }
                placeholder="DD/MM/YYYY"
                className="min-h-[46px] rounded-xl border border-slate-300 px-3 text-base font-mono text-slate-900 focus:border-[#0A1E5C] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">
                status2
              </label>
              <input
                type="text"
                value={row.status2}
                onChange={(e) => onUpdateRow(row.id, 'status2', e.target.value)}
                placeholder="Optional note..."
                className="min-h-[46px] rounded-xl border border-slate-300 px-3 text-base text-slate-900 focus:border-[#0A1E5C] focus:outline-none"
              />
            </div>
          </div>

          {/* Full Path Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">
              Plan File ({shortName})
            </span>
            <p className="text-xs font-mono text-slate-700 break-all leading-relaxed">
              {fullPath}
            </p>
          </div>

          {/* Sheet Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onCopyPath(fullPath)}
              className="min-h-[48px] bg-[#0A1E5C] hover:bg-[#08184A] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Path</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteRow(row.id);
                onClose();
              }}
              className="min-h-[48px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
