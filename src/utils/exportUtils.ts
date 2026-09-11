import * as XLSX from 'xlsx';

/**
 * Universal Data Exporter for CONSCORE ERP IA (Excel / CSV)
 * Guarantees UTF-8 BOM encoding for special characters and accents.
 */

export function exportToExcel(
  data: Record<string, any>[],
  sheetName: string = 'Datos',
  fileName: string = 'export.xlsx'
): boolean {
  try {
    if (!data || data.length === 0) {
      alert('No hay datos disponibles para exportar con los filtros actuales.');
      return false;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

    const finalName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    XLSX.writeFile(workbook, finalName);
    return true;
  } catch (err) {
    console.error('[exportToExcel] Error exporting data:', err);
    return false;
  }
}

export function exportToCSV(
  data: Record<string, any>[],
  fileName: string = 'export.csv'
): boolean {
  try {
    if (!data || data.length === 0) {
      alert('No hay datos disponibles para exportar con los filtros actuales.');
      return false;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('[exportToCSV] Error exporting CSV:', err);
    return false;
  }
}
