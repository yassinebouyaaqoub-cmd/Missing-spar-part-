import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface ExportRowPayload {
  date?: string;
  plant?: string;
  mold?: string;
  insert?: string;
  neededQty?: string;
  hydraStatus?: string;
  manufRepair?: string;
  deadline?: string;
  status2?: string;
}

function buildShortName(mold: string, insert: string): string {
  const m = mold.trim();
  const i = insert.trim();
  if (!m && !i) return '';
  if (!i) return `${m}.pdf`;
  if (!m) return `${i}.pdf`;
  return `${m}-${i}.pdf`;
}

function buildFullPath(mold: string, insert: string): string {
  const m = mold.trim();
  const i = insert.trim();
  if (!m && !i) return '';
  const shortName = buildShortName(m, i);
  if (!i) {
    return `Y:/18.%20Molds/${m}/Plans/${shortName}`;
  }
  return `Y:/18.%20Molds/${m}/${i}/Plans/${shortName}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/export-excel', async (req, res) => {
    try {
      const { rows } = req.body as { rows?: ExportRowPayload[] };
      if (!Array.isArray(rows) || rows.length === 0) {
        res.status(400).json({ error: 'No table rows available to export.' });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Plans Finder - Simple';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Plans Finder', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      sheet.columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Plant', key: 'plant', width: 10 },
        { header: 'Mold', key: 'mold', width: 18 },
        { header: 'Insert', key: 'insert', width: 14 },
        { header: 'Needed Qty', key: 'neededQty', width: 13 },
        { header: 'Hydra Status', key: 'hydraStatus', width: 14 },
        { header: 'Manuf/Repair', key: 'manufRepair', width: 16 },
        { header: 'Deadline', key: 'deadline', width: 14 },
        { header: 'status2', key: 'status2', width: 20 },
        { header: 'Plans', key: 'plans', width: 28 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.height = 26;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0A1E5C' },
        };
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF0A1E5C' } },
          bottom: { style: 'thin', color: { argb: 'FF0A1E5C' } },
          left: { style: 'thin', color: { argb: 'FF1E3A8A' } },
          right: { style: 'thin', color: { argb: 'FF1E3A8A' } },
        };
      });

      rows.forEach((rowData, index) => {
        const mold = String(rowData.mold ?? '').trim();
        const insert = String(rowData.insert ?? '').trim();
        const shortName = buildShortName(mold, insert);
        const fullPath = buildFullPath(mold, insert);

        const row = sheet.addRow({
          date: String(rowData.date ?? ''),
          plant: String(rowData.plant ?? '1310'),
          mold,
          insert,
          neededQty: String(rowData.neededQty ?? '1'),
          hydraStatus: String(rowData.hydraStatus ?? 'No'),
          manufRepair: String(rowData.manufRepair ?? 'Manufacture'),
          deadline: String(rowData.deadline ?? ''),
          status2: String(rowData.status2 ?? ''),
          plans: shortName,
        });

        row.height = 22;
        const isEven = index % 2 === 1;

        row.eachCell((cell, colNumber) => {
          cell.font = {
            name: 'Calibri',
            size: 10,
            color: { argb: 'FF0F172A' },
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: [1, 2, 5, 6, 8].includes(colNumber) ? 'center' : 'left',
          };
          if (isEven) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });

        const plansCell = row.getCell(10);
        if (fullPath && shortName) {
          const escapedPath = fullPath.replace(/"/g, '""');
          const escapedName = shortName.replace(/"/g, '""');
          plansCell.value = {
            formula: `HYPERLINK("${escapedPath}","${escapedName}")`,
            result: shortName,
          };
          plansCell.font = {
            name: 'Calibri',
            size: 10,
            color: { argb: 'FF1D4ED8' },
            underline: true,
          };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const todayStamp = new Date().toISOString().slice(0, 10);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Plans_Finder_${todayStamp}.xlsx"`
      );
      res.send(Buffer.from(buffer));
    } catch (error: unknown) {
      const errObj = error as { message?: string };
      res.status(500).json({ error: errObj?.message || 'Failed to generate Excel file.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Plans Finder - Simple running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
