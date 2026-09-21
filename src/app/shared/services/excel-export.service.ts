import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';

export interface ExcelColumnConfig {
  header: string;
  key: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  numFmt?: string;
}

export interface ExcelExportOptions {
  fileName?: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  columns: ExcelColumnConfig[];
  data: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {



  /**
   * Generic export method to generate a corporate formatted Excel workbook.
   */
  async exportToExcel(options: ExcelExportOptions): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DMW Tracking System';
    workbook.created = new Date();

    const sheetName = (options.sheetName || 'Data').substring(0, 31);
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }]
    });

    let currentRow = 1;

    // Optional Title Header (Power BI / Corporate Report style)
    if (options.title) {
      const titleRow = worksheet.getRow(currentRow);
      titleRow.getCell(1).value = options.title;
      titleRow.getCell(1).font = {
        name: 'Segoe UI',
        size: 14,
        bold: true,
        color: { argb: 'FF0F2027' }
      };
      currentRow++;

      if (options.subtitle) {
        const subRow = worksheet.getRow(currentRow);
        subRow.getCell(1).value = options.subtitle;
        subRow.getCell(1).font = {
          name: 'Segoe UI',
          size: 9,
          italic: true,
          color: { argb: 'FF605E5C' }
        };
        currentRow++;
      }
      currentRow++; // Blank spacer row
    }

    // Header Row
    const headerRowIndex = currentRow;
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.height = 24;

    options.columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      // Microsoft Excel Green / Power BI Corporate Navy Header: #004578 (Fluent Corporate Navy)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF004578' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: col.alignment || 'left',
        wrapText: false
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF002D52' } },
        bottom: { style: 'medium', color: { argb: 'FF002D52' } },
        left: { style: 'thin', color: { argb: 'FF003660' } },
        right: { style: 'thin', color: { argb: 'FF003660' } }
      };
    });

    currentRow++;

    // Data Rows
    options.data.forEach((item, rIdx) => {
      const row = worksheet.getRow(currentRow);
      row.height = 20;
      const isAlt = rIdx % 2 === 1;

      options.columns.forEach((col, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        let val = item[col.key];

        // Format Date objects or numbers if needed
        if (typeof val === 'number') {
          cell.value = val;
          if (col.numFmt) {
            cell.numFmt = col.numFmt;
          }
        } else {
          cell.value = val !== undefined && val !== null ? String(val) : '';
        }

        cell.font = {
          name: 'Segoe UI',
          size: 9.5,
          color: { argb: 'FF201F1E' }
        };

        // Subtle alternating row striping for Excel feel
        if (isAlt) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }

        cell.alignment = {
          vertical: 'middle',
          horizontal: col.alignment || (typeof val === 'number' ? 'right' : 'left')
        };

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE1DFDD' } },
          bottom: { style: 'thin', color: { argb: 'FFE1DFDD' } },
          left: { style: 'thin', color: { argb: 'FFE1DFDD' } },
          right: { style: 'thin', color: { argb: 'FFE1DFDD' } }
        };
      });

      currentRow++;
    });

    // Auto-fit column widths based on maximum content length
    worksheet.columns = options.columns.map((col) => {
      let maxLen = col.header ? String(col.header).length : 10;
      options.data.forEach(row => {
        const val = row[col.key];
        if (val !== undefined && val !== null) {
          const len = String(val).length;
          if (len > maxLen) maxLen = len;
        }
      });
      return {
        key: col.key,
        width: Math.min(45, Math.max(col.width || 12, maxLen + 4))
      };
    });

    // Generate buffer & trigger download in browser
    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, `${options.fileName || 'export'}.xlsx`);
  }

  private downloadFile(buffer: any, fileName: string): void {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
