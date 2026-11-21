import * as XLSX from 'xlsx';
import type { PlanRow } from '../types/plan';
import type { ExtendedFileSystemFileHandle } from './excelHandleDb';
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

type FieldKey =
  | 'date'
  | 'plant'
  | 'mold'
  | 'insert'
  | 'neededQty'
  | 'hydraStatus'
  | 'manufRepair'
  | 'deadline'
  | 'status2'
  | 'plans';

function matchHeaderToKey(headerText: string): FieldKey | null {
  const norm = headerText.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!norm) return null;
  if (norm === 'date') return 'date';
  if (norm === 'plant') return 'plant';
  if (norm === 'mold') return 'mold';
  if (norm === 'insert') return 'insert';
  if (norm === 'neededqty' || norm === 'qty' || norm === 'quantity') return 'neededQty';
  if (norm === 'hydrastatus' || norm === 'hydra') return 'hydraStatus';
  if (norm === 'manufrepair' || norm === 'manuf' || norm === 'repair') return 'manufRepair';
  if (norm === 'deadline' || norm === 'duedate') return 'deadline';
  if (norm === 'status2') return 'status2';
  if (norm === 'plans' || norm === 'plan') return 'plans';
  return null;
}

function getCellDisplayText(cell: XLSX.CellObject | undefined): string {
  if (!cell || cell.v === undefined || cell.v === null) return '';
  return String(cell.v);
}

function findHeaderMapping(sheet: XLSX.WorkSheet): {
  headerRowIdx: number | null;
  colMap: Record<FieldKey, number>;
} {
  const defaultMap: Record<FieldKey, number> = {
    date: 0,
    plant: 1,
    mold: 2,
    insert: 3,
    neededQty: 4,
    hydraStatus: 5,
    manufRepair: 6,
    deadline: 7,
    status2: 8,
    plans: 9,
  };

  if (!sheet['!ref']) {
    return { headerRowIdx: null, colMap: defaultMap };
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const maxScanRow = Math.min(range.e.r, range.s.r + 10);

  for (let r = range.s.r; r <= maxScanRow; r++) {
    const matched: Partial<Record<FieldKey, number>> = {};
    let hits = 0;

    for (let c = range.s.c; c <= Math.min(range.e.c, 30); c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const text = getCellDisplayText(sheet[addr]);
      const key = matchHeaderToKey(text);
      if (key && matched[key] === undefined) {
        matched[key] = c;
        hits++;
      }
    }

    if (hits >= 3 && (matched.mold !== undefined || matched.plans !== undefined)) {
      const finalMap: Record<FieldKey, number> = { ...defaultMap };
      let nextCol = range.e.c + 1;

      (Object.keys(defaultMap) as FieldKey[]).forEach((key) => {
        if (matched[key] !== undefined) {
          finalMap[key] = matched[key] as number;
        } else {
          finalMap[key] = nextCol++;
        }
      });

      return { headerRowIdx: r, colMap: finalMap };
    }
  }

  return { headerRowIdx: null, colMap: defaultMap };
}

function findLastPopulatedRow(
  sheet: XLSX.WorkSheet,
  minRow: number
): number {
  if (!sheet['!ref']) return -1;
  const range = XLSX.utils.decode_range(sheet['!ref']);

  for (let r = range.e.r; r >= minRow; r--) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (cell && (cell.v !== undefined && cell.v !== '' || cell.f)) {
        return r;
      }
    }
  }
  return minRow - 1;
}

function writeRowCells(
  sheet: XLSX.WorkSheet,
  rowIdx: number,
  row: PlanRow,
  colMap: Record<FieldKey, number>
): number {
  const shortName = buildShortName(row.mold, row.insert);
  const fullPath = buildFullPath(row.mold, row.insert);

  const setTextCell = (col: number, val: string) => {
    const addr = XLSX.utils.encode_cell({ r: rowIdx, c: col });
    sheet[addr] = { t: 's', v: val };
  };

  setTextCell(colMap.date, row.date);
  setTextCell(colMap.plant, row.plant);
  setTextCell(colMap.mold, row.mold);
  setTextCell(colMap.insert, row.insert);
  setTextCell(colMap.neededQty, row.neededQty);
  setTextCell(colMap.hydraStatus, row.hydraStatus);
  setTextCell(colMap.manufRepair, row.manufRepair);
  setTextCell(colMap.deadline, row.deadline);
  setTextCell(colMap.status2, row.status2);

  const plansAddr = XLSX.utils.encode_cell({ r: rowIdx, c: colMap.plans });
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

  return Math.max(...Object.values(colMap));
}

export async function appendRowsToExcelHandle(
  handle: ExtendedFileSystemFileHandle,
  newRows: PlanRow[]
): Promise<{ sheetName: string; appendedCount: number }> {
  const file = await handle.getFile();
  const arrayBuffer = await file.arrayBuffer();

  let workbook: XLSX.WorkBook;
  if (arrayBuffer.byteLength === 0) {
    workbook = XLSX.utils.book_new();
  } else {
    workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellFormula: true,
      cellNF: true,
      cellStyles: true,
    });
  }

  let sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    sheetName = 'Plans Finder';
    const emptySheet = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, emptySheet, sheetName);
  }

  const sheet = workbook.Sheets[sheetName];
  const { headerRowIdx, colMap } = findHeaderMapping(sheet);

  let startInsertRow: number;
  let maxCol = 9;

  if (!sheet['!ref']) {
    // Brand new empty sheet: write headers in row 0
    STANDARD_HEADERS.forEach((header, idx) => {
      const addr = XLSX.utils.encode_cell({ r: 0, c: idx });
      sheet[addr] = { t: 's', v: header };
    });
    startInsertRow = 1;
  } else {
    const existingRange = XLSX.utils.decode_range(sheet['!ref']);
    const searchFrom = headerRowIdx !== null ? headerRowIdx : existingRange.s.r;
    const lastRow = findLastPopulatedRow(sheet, searchFrom);
    startInsertRow = Math.max(lastRow + 1, headerRowIdx !== null ? headerRowIdx + 1 : 0);
    maxCol = Math.max(existingRange.e.c, ...Object.values(colMap));
  }

  newRows.forEach((row, index) => {
    const rowIdx = startInsertRow + index;
    const rowMaxCol = writeRowCells(sheet, rowIdx, row, colMap);
    if (rowMaxCol > maxCol) {
      maxCol = rowMaxCol;
    }
  });

  const existingRange = sheet['!ref']
    ? XLSX.utils.decode_range(sheet['!ref'])
    : { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } };

  const newEndRow = Math.max(existingRange.e.r, startInsertRow + newRows.length - 1);
  const newEndCol = Math.max(existingRange.e.c, maxCol);

  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: Math.min(existingRange.s.r, 0), c: Math.min(existingRange.s.c, 0) },
    e: { r: newEndRow, c: newEndCol },
  });

  const outBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true,
  });

  const writable = await handle.createWritable();
  await writable.write(new Uint8Array(outBuffer));
  await writable.close();

  return {
    sheetName,
    appendedCount: newRows.length,
  };
}

export function downloadSnapshotWorkbook(rows: PlanRow[]): void {
  const sheet: XLSX.WorkSheet = {};
  STANDARD_HEADERS.forEach((header, idx) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: idx });
    sheet[addr] = { t: 's', v: header };
  });

  const defaultMap: Record<FieldKey, number> = {
    date: 0,
    plant: 1,
    mold: 2,
    insert: 3,
    neededQty: 4,
    hydraStatus: 5,
    manufRepair: 6,
    deadline: 7,
    status2: 8,
    plans: 9,
  };

  rows.forEach((row, idx) => {
    writeRowCells(sheet, idx + 1, row, defaultMap);
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
    { wch: 18 },
    { wch: 26 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Plans Finder');
  const todayStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Plans_Finder_${todayStamp}.xlsx`);
}
