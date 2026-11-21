import * as XLSX from 'xlsx';
import type { PlanRow } from '../types/plan';
import { buildFullPath, buildShortName } from './pathUtils';

const STANDARD_HEADERS = [
  'Date',
  'Plant',
  'Mold',
  'Insert',
  'Needed Qty',
  'Hydra Status',
  'Manuf/Repair',
  'Deadline',
  'status2',
  'Plans',
] as const;

export function exportPlansToExcel(rows: PlanRow[]): void {
  const sheet: XLSX.WorkSheet = {};

  STANDARD_HEADERS.forEach((header, idx) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: idx });
    sheet[addr] = { t: 's', v: header };
  });

  rows.forEach((row, idx) => {
    const r = idx + 1;
    const shortName = buildShortName(row.mold, row.insert);
    const fullPath = buildFullPath(row.mold, row.insert);

    const values = [
      row.date,
      row.plant,
      row.mold,
      row.insert,
      row.neededQty,
      row.hydraStatus,
      row.manufRepair,
      row.deadline,
      row.status2,
    ];

    values.forEach((val, c) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      sheet[addr] = { t: 's', v: val };
    });

    const plansAddr = XLSX.utils.encode_cell({ r, c: 9 });
    if (fullPath && shortName) {
      const escapedPath = fullPath.replace(/"/g, '""');
      const escapedName = shortName.replace(/"/g, '""');
      sheet[plansAddr] = {
        t: 's',
        f: `HYPERLINK("${escapedPath}","${escapedName}")`,
        v: shortName,
      };
    } else {
      sheet[plansAddr] = { t: 's', v: '' };
    }
  });

  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rows.length, c: 9 },
  });

  sheet['!cols'] = [
    { wch: 13 },
    { wch: 9 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 13 },
    { wch: 15 },
    { wch: 13 },
    { wch: 16 },
    { wch: 26 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Plans Finder');
  const todayStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Plans_Finder_${todayStamp}.xlsx`);
}
